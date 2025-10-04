# Loppestars API Proxy

Edge Function that proxies requests to the FastAPI backend on AWS ECS.

## URLs

- **Edge Function (Proxy)**: `https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy`
- **Direct API**: `https://loppestars.spoons.dk`

## Usage

The proxy accepts a `path` parameter that specifies which FastAPI endpoint to call.

### Testing the Proxy

```bash
# Health check via proxy
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health"

# Today's markets via proxy
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=markets/today"

# Nearby markets via proxy (with query params)
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=markets/nearby&latitude=55.6761&longitude=12.5683&radius_km=50"

# Process image (POST) via proxy
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=process" \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "user123/photo.jpg",
    "userId": "user123",
    "mode": "pixelate",
    "pixelateSize": 15
  }'

# Trigger scraper via proxy
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=scraper/trigger"
```

### Testing the Direct API

```bash
# Health check direct
curl "https://loppestars.spoons.dk/health"

# Today's markets direct
curl "https://loppestars.spoons.dk/markets/today"

# Nearby markets direct
curl "https://loppestars.spoons.dk/markets/nearby?latitude=55.6761&longitude=12.5683&radius_km=50"

# Process image (POST) direct
curl -X POST "https://loppestars.spoons.dk/process" \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "user123/photo.jpg",
    "userId": "user123",
    "mode": "pixelate",
    "pixelateSize": 15
  }'

# Trigger scraper direct
curl -X POST "https://loppestars.spoons.dk/scraper/trigger"
```

## Supported FastAPI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| POST | `/process` | Process images with face anonymization |
| GET | `/markets/today` | Get today's markets |
| GET | `/markets/nearby` | Get nearby markets with geolocation |
| POST | `/scraper/trigger` | Manually trigger market scraper |

## Query Parameters

### `/markets/today`
- `latitude` (optional): User's latitude for distance calculation
- `longitude` (optional): User's longitude for distance calculation
- `limit` (optional, default: 50): Maximum number of markets to return

### `/markets/nearby`
- `latitude` (required): User's latitude
- `longitude` (required): User's longitude
- `radius_km` (optional, default: 50.0): Search radius in kilometers
- `days_ahead` (optional, default: 30): Number of days to look ahead
- `limit` (optional, default: 50): Maximum number of markets to return

## Environment Variables

- `API_BASE_URL`: Backend API base URL (default: `https://loppestars.spoons.dk`)

## CORS

The proxy handles CORS for all origins, allowing the mobile app to call the API from any domain.

## Benefits of Using the Proxy

1. **CORS Handling**: Automatic CORS headers for browser-based requests
2. **Unified Endpoint**: Single Supabase domain for all API calls
3. **Authentication**: Can add Supabase auth checks in the proxy
4. **Rate Limiting**: Can implement rate limiting at the edge
5. **Caching**: Can add edge caching for frequently accessed data
6. **Monitoring**: Centralized logging and monitoring via Supabase

## When to Use Direct API

- For testing backend changes before deploying proxy updates
- For debugging FastAPI-specific issues
- For higher performance when CORS is not needed (server-to-server)
- For accessing OpenAPI/Swagger docs at `/docs`
