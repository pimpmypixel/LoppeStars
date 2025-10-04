# Supabase Edge Functions

This directory contains Supabase Edge Functions for server-side processing.

## Functions

### api-proxy

Proxies requests to the FastAPI backend on AWS ECS with CORS handling.

**Endpoint:** `GET/POST /functions/v1/api-proxy?path=<endpoint>`

**Edge Function URL:** `https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy`

**Direct API URL:** `https://loppestars.spoons.dk`

**Request Examples:**
```bash
# Health check
GET /functions/v1/api-proxy?path=health

# Today's markets
GET /functions/v1/api-proxy?path=markets/today

# Nearby markets with geolocation
GET /functions/v1/api-proxy?path=markets/nearby&latitude=55.6761&longitude=12.5683&radius_km=50

# Process image (POST with JSON body)
POST /functions/v1/api-proxy?path=process
Body: {
  "imagePath": "user123/photo.jpg",
  "userId": "user123",
  "mode": "pixelate",
  "pixelateSize": 15
}

# Trigger scraper
POST /functions/v1/api-proxy?path=scraper/trigger
```

**Features:**
- Proxies all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Automatic CORS handling for browser-based requests
- Query parameter forwarding
- Request/response header forwarding
- Binary and JSON body support
- Detailed error logging
- Configurable backend via API_BASE_URL environment variable

**See:** `api-proxy/README.md` for detailed documentation

---

### send-scrape-status

Logs market scraper status to database for monitoring and notifications.

**Endpoint:** `POST /functions/v1/send-scrape-status`

**Request Body:**
```json
{
  "summary": {
    "marketsScraped": 123,
    "newMarkets": 5,
    "updatedMarkets": 18,
    "errors": 0
  },
  "status": "success",
  "scrapeDate": "2025-10-04T12:00:00Z",
  "emails": ["admin@loppestars.dk"]
}
```

**Response:**
```json
{
  "success": true,
  "logged": true,
  "id": "uuid-here",
  "message": "Scrape status logged successfully"
}
```

**Features:**
- Logs scrape results to `scrape_status_logs` table
- Optional email notifications (TODO: implement SMTP)
- Status tracking (success/error)
- Detailed summary data storage

---

## Shared Resources

### _shared/cors.ts

CORS headers shared across all edge functions:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Development

### Local Development
```bash
# Start Supabase locally (requires Docker)
supabase start

# Serve functions locally on http://localhost:54321/functions/v1
supabase functions serve

# Test function locally
curl "http://localhost:54321/functions/v1/api-proxy?path=health"
```

### Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy api-proxy

# Deploy with environment variables
supabase secrets set API_BASE_URL=https://loppestars.spoons.dk
supabase secrets set SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Environment Variables

**Required for all functions:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)

**Optional:**
- `API_BASE_URL` - Backend API URL (default: `https://loppestars.spoons.dk`)

---

## Architecture

```
┌─────────────────┐
│  Mobile App     │
└────────┬────────┘
         │
         │ HTTPS
         ↓
┌─────────────────────────┐
│  Supabase Edge Function │
│  (api-proxy)            │
│  - CORS handling        │
│  - Request forwarding   │
└────────┬────────────────┘
         │
         │ HTTPS
         ↓
┌─────────────────────────┐
│  FastAPI on AWS ECS     │
│  (loppestars.spoons.dk) │
│  - Face processing      │
│  - Market data API      │
│  - Scraper triggers     │
└─────────────────────────┘
```

---

## Migration Status

✅ **api-proxy**: Migrated and functional
- Handles all FastAPI endpoints
- Full HTTP method support
- CORS configured
- Query parameter forwarding
- Documentation complete

✅ **send-scrape-status**: Migrated and functional
- Database logging working
- Error handling implemented
- Email notifications pending (TODO)

❌ **process-image**: Removed
- Face processing moved to FastAPI on AWS ECS
- Use `POST /api-proxy?path=process` instead

---

## Testing

### Test api-proxy

```bash
# Via Supabase Edge Function
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health"

# Direct to FastAPI (no CORS)
curl "https://loppestars.spoons.dk/health"
```

### Test send-scrape-status

```bash
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": {
      "marketsScraped": 10,
      "newMarkets": 2
    },
    "status": "success"
  }'
```

---

## Deployment Checklist

When deploying new edge functions:

1. ✅ Ensure `_shared/cors.ts` is present
2. ✅ Add function documentation to this README
3. ✅ Set required environment variables via `supabase secrets set`
4. ✅ Test locally with `supabase functions serve`
5. ✅ Deploy with `supabase functions deploy <function-name>`
6. ✅ Test deployed function with curl
7. ✅ Update mobile app to use new endpoints
8. ✅ Monitor logs via Supabase dashboard

---

## Troubleshooting

**CORS errors:**
- Check `corsHeaders` in `_shared/cors.ts`
- Verify OPTIONS method is handled
- Check response headers include CORS headers

**Environment variables not working:**
- Use `Deno.env.get('VAR_NAME')` not `process.env`
- Set secrets via `supabase secrets set`
- Redeploy after changing secrets

**Function not found:**
- Ensure function is deployed: `supabase functions deploy`
- Check function name matches URL path
- Verify Supabase project is correct

**Import errors:**
- Use Deno-compatible imports from `deno.land` or `esm.sh`
- Don't use Node.js imports
- Check import URLs are accessible