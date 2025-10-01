from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import os, cv2, numpy as np, requests, time
from datetime import date, datetime
from typing import List, Optional
from supabase import create_client, Client

app = FastAPI()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SOURCE_BUCKET = os.environ.get("SOURCE_BUCKET", "stall-photos")
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET", "stall-photos-processed")

PROTO_PATH = "/models/deploy.prototxt"
MODEL_PATH = "/models/res10_300x300_ssd_iter_140000.caffemodel"
net = cv2.dnn.readNetFromCaffe(PROTO_PATH, MODEL_PATH)

# Initialize Supabase client for market queries
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class ProcessRequest(BaseModel):
    imagePath: str
    userId: str
    blurStrength: int = 31
    downscale_for_detection: int = 800

class MarketResponse(BaseModel):
    id: str
    external_id: str
    name: str
    municipality: Optional[str]
    category: str
    start_date: date
    end_date: date
    address: Optional[str]
    city: Optional[str]
    postal_code: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
    organizer_name: Optional[str]
    organizer_phone: Optional[str]
    organizer_email: Optional[str]
    organizer_website: Optional[str]
    opening_hours: Optional[str]
    entry_fee: Optional[float]
    stall_count: Optional[int]
    has_food: bool
    has_parking: bool
    has_toilets: bool
    has_wifi: bool
    is_indoor: bool
    is_outdoor: bool
    special_features: Optional[str]
    source_url: Optional[str]
    scraped_at: datetime
    distance: Optional[float] = None  # Calculated distance in km

def supabase_download(image_path: str) -> bytes:
    url = f"{SUPABASE_URL}/storage/v1/object/sign/{SOURCE_BUCKET}/{image_path}"
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        raise RuntimeError(f"Download failed: {r.status_code} {r.text}")
    return r.content

def supabase_upload(image_bytes: bytes, dest_path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{dest_path}"
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    r = requests.put(url, headers=headers, data=image_bytes, params={"content-type": "image/jpeg"})
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed: {r.status_code} {r.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{dest_path}"

def detect_faces(img: np.ndarray, max_dim: int=800):
    h, w = img.shape[:2]
    scale = min(1.0, max_dim / float(max(h, w)))
    small = cv2.resize(img, (int(w*scale), int(h*scale))) if scale < 1 else img.copy()
    blob = cv2.dnn.blobFromImage(cv2.resize(small, (300, 300)), 1.0,
                                 (300, 300), (104.0, 177.0, 123.0))
    net.setInput(blob)
    detections = net.forward()
    boxes = []
    for i in range(detections.shape[2]):
        conf = detections[0, 0, i, 2]
        if conf > 0.5:
            box = detections[0, 0, i, 3:7] * np.array([small.shape[1], small.shape[0],
small.shape[1], small.shape[0]])
            (x1, y1, x2, y2) = box.astype("int")
            if scale < 1:
                x1, y1, x2, y2 = int(x1/scale), int(y1/scale), int(x2/scale), int(y2/scale)
            boxes.append((x1, y1, x2, y2))
    return boxes

def blur_faces(img: np.ndarray, boxes, k: int):
    out = img.copy()
    if k % 2 == 0: k += 1
    for (x1, y1, x2, y2) in boxes:
        roi = out[y1:y2, x1:x2]
        blurred = cv2.GaussianBlur(roi, (k, k), 0)
        out[y1:y2, x1:x2] = blurred
    return out

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    from math import radians, cos, sin, asin, sqrt

    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

@app.post("/process")
async def process(req: ProcessRequest):
    try:
        img_bytes = supabase_download(req.imagePath)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(400, "Invalid image")

        boxes = detect_faces(img, req.downscale_for_detection)
        processed = blur_faces(img, boxes, req.blurStrength) if boxes else img
        ok, encoded = cv2.imencode(".jpg", processed, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        if not ok: raise HTTPException(500, "Encoding failed")

        dest_path = f"{req.userId}/{int(time.time()*1000)}-processed.jpg"
        url = supabase_upload(encoded.tobytes(), dest_path)

        return {"success": True, "processedImageUrl": url, "facesDetected": len(boxes)}

    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/markets/today", response_model=List[MarketResponse])
async def get_todays_markets(
    latitude: Optional[float] = Query(None, description="User's latitude for distance calculation"),
    longitude: Optional[float] = Query(None, description="User's longitude for distance calculation"),
    limit: int = Query(50, description="Maximum number of markets to return")
):
    """Get markets happening today"""
    try:
        today = date.today()

        # Query markets that are active today
        query = supabase.table('markets').select('*').gte('start_date', today.isoformat()).lte('end_date', today.isoformat())

        result = query.limit(limit).execute()

        markets = []
        for market in result.data:
            market_dict = dict(market)
            market_dict['start_date'] = date.fromisoformat(market['start_date'])
            market_dict['end_date'] = date.fromisoformat(market['end_date'])
            market_dict['scraped_at'] = datetime.fromisoformat(market['scraped_at'].replace('Z', '+00:00'))

            # Calculate distance if coordinates provided
            if latitude is not None and longitude is not None and market.get('latitude') and market.get('longitude'):
                market_dict['distance'] = calculate_distance(
                    latitude, longitude,
                    market['latitude'], market['longitude']
                )

            markets.append(MarketResponse(**market_dict))

        # Sort by distance if coordinates provided, otherwise by start date
        if latitude is not None and longitude is not None:
            markets.sort(key=lambda x: x.distance or float('inf'))
        else:
            markets.sort(key=lambda x: x.start_date)

        return markets

    except Exception as e:
        raise HTTPException(500, f"Error fetching today's markets: {str(e)}")

@app.get("/markets/nearby", response_model=List[MarketResponse])
async def get_nearby_markets(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    days_ahead: int = Query(30, description="Number of days to look ahead"),
    limit: int = Query(50, description="Maximum number of markets to return")
):
    """Get markets within a certain radius and time frame"""
    try:
        from datetime import timedelta

        today = date.today()
        end_date = today + timedelta(days=days_ahead)

        # First, get all markets within the date range
        query = supabase.table('markets').select('*').gte('start_date', today.isoformat()).lte('start_date', end_date.isoformat())

        result = query.execute()

        nearby_markets = []
        for market in result.data:
            if market.get('latitude') and market.get('longitude'):
                distance = calculate_distance(
                    latitude, longitude,
                    market['latitude'], market['longitude']
                )

                if distance <= radius_km:
                    market_dict = dict(market)
                    market_dict['start_date'] = date.fromisoformat(market['start_date'])
                    market_dict['end_date'] = date.fromisoformat(market['end_date'])
                    market_dict['scraped_at'] = datetime.fromisoformat(market['scraped_at'].replace('Z', '+00:00'))
                    market_dict['distance'] = distance

                    nearby_markets.append(MarketResponse(**market_dict))

        # Sort by distance
        nearby_markets.sort(key=lambda x: x.distance or float('inf'))

        return nearby_markets[:limit]

    except Exception as e:
        raise HTTPException(500, f"Error fetching nearby markets: {str(e)}")

@app.post("/scraper/trigger")
async def trigger_scraper():
    """Manually trigger the market scraper"""
    try:
        import subprocess
        import sys

        # Run the scraper script
        result = subprocess.run([
            sys.executable, "/app/scraper_cron.py"
        ], capture_output=True, text=True, cwd="/app")

        if result.returncode == 0:
            return {
                "success": True,
                "message": "Scraper triggered successfully",
                "output": result.stdout
            }
        else:
            raise HTTPException(500, f"Scraper failed: {result.stderr}")

    except Exception as e:
        raise HTTPException(500, f"Error triggering scraper: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "loppestars-faceblur-api"}

