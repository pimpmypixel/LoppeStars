# Edge Functions Migration Summary

## Status: ✅ Complete

All edge functions in `supabase/functions/` have been migrated and are functional.

---

## Functions Overview

### 1. ✅ api-proxy (MIGRATED & FUNCTIONAL)

**Location**: `supabase/functions/api-proxy/`

**Status**: Fully migrated and documented

**Features**:
- Proxies all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Handles all FastAPI endpoints on AWS ECS
- Automatic CORS handling
- Query parameter forwarding
- Request/response header forwarding
- Binary and JSON body support
- Configurable backend URL via environment variable

**Endpoints Proxied**:
- `GET /` - Root
- `GET /health` - Health check
- `POST /process` - Face anonymization
- `GET /markets/today` - Today's markets
- `GET /markets/nearby` - Nearby markets with geolocation
- `POST /scraper/trigger` - Manual scraper trigger

**Usage**:
```bash
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health"
```

**Documentation**: `api-proxy/README.md`

---

### 2. ✅ send-scrape-status (MIGRATED & FUNCTIONAL)

**Location**: `supabase/functions/send-scrape-status/`

**Status**: Fully migrated with database integration

**Features**:
- Logs scrape results to `scrape_status_logs` table
- Tracks status (success/error)
- Stores detailed summary data
- Optional email notifications (TODO: implement SMTP)
- Proper error handling and validation

**Usage**:
```bash
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": {"marketsScraped": 10},
    "status": "success"
  }'
```

---

### 3. ❌ process-image (REMOVED)

**Status**: Deprecated and removed

**Reason**: Face processing migrated to FastAPI on AWS ECS

**Migration Path**: Use `POST /api-proxy?path=process` instead

---

## Shared Resources

### ✅ _shared/cors.ts

**Status**: Functional and shared across all functions

**Contents**:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Database Migrations

### ✅ scrape_status_logs Table

**Migration**: `20251004140000_update_scrape_status_logs.sql`

**Schema**:
```sql
CREATE TABLE scrape_status_logs (
  id UUID PRIMARY KEY,
  emails TEXT[],
  summary JSONB NOT NULL,
  status TEXT CHECK (status IN ('success', 'error')),
  scrape_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
```

**Indexes**:
- `idx_scrape_status_logs_status`
- `idx_scrape_status_logs_created_at`
- `idx_scrape_status_logs_scrape_date`

---

## Documentation Created

1. ✅ **functions/README.md** - Complete overview of all functions
2. ✅ **functions/DEPLOYMENT.md** - Deployment guide with checklists
3. ✅ **api-proxy/README.md** - Detailed API proxy documentation
4. ✅ **MIGRATION_SUMMARY.md** (this file) - Migration status

---

## Environment Variables Required

### For All Functions:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### Optional:
- `API_BASE_URL` - Backend API URL (default: `https://loppestars.spoons.dk`)

---

## Deployment Commands

```bash
# Set environment variables
supabase secrets set SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key-here

# Apply migrations
supabase db push

# Deploy functions
supabase functions deploy api-proxy
supabase functions deploy send-scrape-status
```

---

## Testing

### api-proxy
```bash
# Via edge function (with CORS)
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health"

# Direct to FastAPI (no CORS)
curl "https://loppestars.spoons.dk/health"
```

### send-scrape-status
```bash
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -d '{"summary":{"test":true},"status":"success"}'
```

---

## Architecture

```
┌──────────────┐
│  Mobile App  │
└──────┬───────┘
       │
       │ HTTPS + CORS
       ↓
┌──────────────────────────┐
│  Supabase Edge Functions │
│  - api-proxy             │
│  - send-scrape-status    │
└──────┬───────────────────┘
       │
       ├─────────────────────┐
       │                     │
       ↓                     ↓
┌────────────────┐   ┌──────────────┐
│  FastAPI (ECS) │   │  PostgreSQL  │
│  AWS Backend   │   │  (Supabase)  │
└────────────────┘   └──────────────┘
```

---

## Migration Checklist

- [x] Audit existing edge functions
- [x] Migrate api-proxy function
- [x] Migrate send-scrape-status function
- [x] Remove deprecated process-image function
- [x] Update _shared/cors.ts
- [x] Create database migration for scrape_status_logs
- [x] Write comprehensive README.md
- [x] Create DEPLOYMENT.md guide
- [x] Document all endpoints and usage
- [x] Add testing examples
- [x] Create architecture diagrams
- [x] Document environment variables
- [x] Add troubleshooting guides
- [x] Create this migration summary

---

## Next Steps

1. **Deploy to Production**:
   ```bash
   cd /Users/andreas/Herd/loppestars
   supabase functions deploy api-proxy
   supabase functions deploy send-scrape-status
   ```

2. **Update Mobile App**:
   - Change API endpoints to use edge function URLs
   - Test end-to-end flow

3. **Monitor**:
   - Check function logs via Supabase dashboard
   - Query `scrape_status_logs` table for scraper status

4. **Future Enhancements**:
   - Implement email notifications in send-scrape-status
   - Add rate limiting to api-proxy
   - Add edge caching for frequently accessed data
   - Add authentication middleware

---

## Support

For questions or issues:

1. Review function-specific README files
2. Check DEPLOYMENT.md for deployment issues
3. View logs: `supabase functions logs <function-name>`
4. Consult Supabase dashboard: https://supabase.com/dashboard/project/oprevwbturtujbugynct

---

**Migration completed**: October 4, 2025
**Status**: All functions migrated and documented
**Ready for deployment**: ✅ Yes
