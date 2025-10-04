# Edge Functions Deployment Guide

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Supabase project credentials**:
   - Project URL: `https://oprevwbturtujbugynct.supabase.co`
   - Service role key (from Supabase dashboard)

3. **Login to Supabase**:
   ```bash
   supabase login
   ```

4. **Link to project**:
   ```bash
   supabase link --project-ref oprevwbturtujbugynct
   ```

---

## Deploy All Functions

### 1. Set Environment Variables

```bash
# Required for all functions
supabase secrets set SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Custom backend URL for api-proxy
supabase secrets set API_BASE_URL=https://loppestars.spoons.dk
```

### 2. Run Database Migrations

```bash
# Apply all migrations including scrape_status_logs table
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy api-proxy
supabase functions deploy api-proxy

# Deploy send-scrape-status
supabase functions deploy send-scrape-status
```

---

## Verify Deployment

### Test api-proxy

```bash
# Health check
curl "https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy?path=health"

# Expected response:
# {"status":"healthy","service":"loppestars"}
```

### Test send-scrape-status

```bash
curl -X POST "https://oprevwbturtujbugynct.supabase.co/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "summary": {
      "test": true,
      "marketsScraped": 0
    },
    "status": "success"
  }'

# Expected response:
# {"success":true,"logged":true,"id":"uuid-here","message":"Scrape status logged successfully"}
```

---

## Monitoring

### View Function Logs

```bash
# View logs for api-proxy
supabase functions logs api-proxy

# View logs for send-scrape-status
supabase functions logs send-scrape-status

# Follow logs in real-time
supabase functions logs api-proxy --follow
```

### Query Scrape Logs

```sql
-- View recent scrape logs
SELECT 
  id,
  status,
  summary,
  scrape_date,
  created_at
FROM scrape_status_logs
ORDER BY created_at DESC
LIMIT 10;

-- Count scrapes by status
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as last_run
FROM scrape_status_logs
GROUP BY status;
```

---

## Troubleshooting

### Function Not Found (404)

```bash
# List deployed functions
supabase functions list

# Redeploy if missing
supabase functions deploy <function-name>
```

### Environment Variables Not Working

```bash
# List current secrets
supabase secrets list

# Update secret
supabase secrets set KEY=value

# Redeploy function after updating secrets
supabase functions deploy <function-name>
```

### CORS Errors

Check `_shared/cors.ts` has correct headers:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Database Connection Errors

Verify environment variables:
```bash
supabase secrets list
# Should show SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

---

## Local Testing

### 1. Start Supabase Locally

```bash
cd /Users/andreas/Herd/loppestars
supabase start
```

### 2. Serve Functions Locally

```bash
supabase functions serve --env-file .env
```

### 3. Test Locally

```bash
# Test api-proxy locally
curl "http://localhost:54321/functions/v1/api-proxy?path=health"

# Test send-scrape-status locally
curl -X POST "http://localhost:54321/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -d '{"summary": {"test": true}, "status": "success"}'
```

---

## Rollback

If a deployment causes issues:

```bash
# View function versions
supabase functions list

# Redeploy previous version (if you have the code)
git checkout <previous-commit>
supabase functions deploy <function-name>
```

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables set via `supabase secrets set`
- [ ] Database migrations applied via `supabase db push`
- [ ] Functions tested locally with `supabase functions serve`
- [ ] CORS headers configured correctly
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Documentation updated (README.md)
- [ ] Mobile app updated to use new endpoints
- [ ] Monitoring set up (Supabase dashboard)
- [ ] Rollback plan documented

---

## Next Steps

After deploying edge functions:

1. **Update Mobile App**: Change API endpoints to use edge function URLs
2. **Monitor Logs**: Check Supabase dashboard for errors
3. **Test End-to-End**: Verify full flow from app to API
4. **Set Up Alerts**: Configure notifications for failures
5. **Document Changes**: Update Copilot instructions and README files

---

## Support

For issues or questions:

1. Check function logs: `supabase functions logs <name>`
2. Review Supabase dashboard: https://supabase.com/dashboard/project/oprevwbturtujbugynct
3. Consult documentation: https://supabase.com/docs/guides/functions
4. Check this README and individual function READMEs
