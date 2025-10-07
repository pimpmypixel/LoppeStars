from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
import os, numpy as np, requests, time
from datetime import date, datetime
from typing import List, Optional
from supabase import create_client, Client
from face_processor import get_face_processor
import logging

# Setup logging
logger = logging.getLogger(__name__)

app = FastAPI()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SOURCE_BUCKET = os.environ.get("SOURCE_BUCKET", "stall-photos")
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET", "stall-photos-processed")

# Initialize Supabase client for market queries
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Initialize face processor (singleton pattern)
face_processor = get_face_processor()

class ProcessRequest(BaseModel):
    imagePath: str
    userId: str
    mode: str = "pixelate"  # "pixelate" or "blur"
    pixelateSize: int = 20
    blurStrength: int = 31
    downscaleForDetection: int = 800

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
    loppemarkeder_nu: Optional[dict]  # Raw metadata from loppemarkeder.nu
    scraped_at: datetime
    distance: Optional[float] = None  # Calculated distance in km

def supabase_download(image_path: str) -> bytes:
    """Download image from Supabase Storage using signed URL"""
    # Create a signed URL with 60 second expiry
    sign_url = f"{SUPABASE_URL}/storage/v1/object/sign/{SOURCE_BUCKET}/{image_path}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY, 
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Request a signed URL
    sign_response = requests.post(sign_url, headers=headers, json={"expiresIn": 60})
    if sign_response.status_code != 200:
        raise RuntimeError(f"Failed to create signed URL: {sign_response.status_code} {sign_response.text}")
    
    signed_data = sign_response.json()
    signed_path = signed_data.get("signedURL")
    
    if not signed_path:
        raise RuntimeError(f"No signed URL returned: {sign_response.text}")
    
    # Download using the signed URL (full URL with token)
    download_url = f"{SUPABASE_URL}/storage/v1{signed_path}"
    download_response = requests.get(download_url, headers={"apikey": SUPABASE_SERVICE_KEY})
    
    if download_response.status_code != 200:
        raise RuntimeError(f"Download failed: {download_response.status_code} {download_response.text}")
    
    return download_response.content

def supabase_upload(image_bytes: bytes, dest_path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{dest_path}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY, 
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/jpeg"
    }
    r = requests.put(url, headers=headers, data=image_bytes)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed: {r.status_code} {r.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{dest_path}"

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
    """
    Process an image to anonymize faces.
    Supports both pixelation and blur modes.
    """
    try:
        # Download image from Supabase
        img_bytes = supabase_download(req.imagePath)
        
        # Process image with face processor
        processed_bytes, faces_detected = face_processor.process_image(
            image_bytes=img_bytes,
            mode=req.mode,
            pixelate_size=req.pixelateSize,
            blur_strength=req.blurStrength,
            max_dimension=req.downscaleForDetection
        )
        
        # Upload processed image
        dest_path = f"{req.userId}/{int(time.time()*1000)}-processed.jpg"
        url = supabase_upload(processed_bytes, dest_path)

        return {
            "success": True,
            "processedImageUrl": url,
            "facesDetected": faces_detected,
            "mode": req.mode
        }

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
async def trigger_scraper(background_tasks: BackgroundTasks):
    """Manually trigger the market scraper (runs in background)"""
    try:
        import subprocess
        import sys
        
        def run_scraper_background():
            """Run scraper in background without blocking API"""
            try:
                print("Starting background scraper task...")
                # Use Popen instead of run to avoid blocking
                process = subprocess.Popen(
                    [sys.executable, "/app/scraper_cron.py"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd="/app"
                )
                print(f"Scraper process started with PID: {process.pid}")
                # Don't wait for completion - let it run in background
                # Process will be monitored by the scheduler
            except Exception as e:
                print(f"Error starting scraper: {str(e)}")
        
        # Add to background tasks
        background_tasks.add_task(run_scraper_background)
        
        return {
            "success": True,
            "message": "Scraper triggered successfully in background",
            "note": "The scraper will run asynchronously. Check logs for progress."
        }

    except Exception as e:
        raise HTTPException(500, f"Error triggering scraper: {str(e)}")


@app.get("/")
async def root():
    return {"message": "Welcome to the Loppestars API"}
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "loppestars"}
