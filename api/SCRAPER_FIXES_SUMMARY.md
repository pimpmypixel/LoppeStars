# Scraper Fixes Summary - October 7, 2025

## Problem
No records were appearing in the `markets` table, and scraping spiders were not being triggered properly.

## Root Causes Identified

### 1. **AttributeError in Pipeline** (First Issue)
- **Error**: `'str' object has no attribute 'get'`
- **Cause**: Tried to call `item.get('name')` before converting Scrapy Item to dict
- **Fix**: Moved `market_data = dict(item)` before accessing fields

### 2. **API Response Error** (Second Issue)
- **Error**: `'Cannot coerce the result to a single JSON object'` (PGRST116)
- **Cause**: Using `.single()` on Supabase query when market doesn't exist yet (returns 0 rows)
- **Fix**: Changed to `.maybe_single()` and wrapped in try/except for new markets

### 3. **Title/Description Field Format** (Third Issue)
- **Error**: `'str' object has no attribute 'get'` in loppemarkeder spider
- **Cause**: API sometimes returns `title` as string, sometimes as `{rendered: "..."}` dict
- **Fix**: Added type checking with `isinstance()` to handle both formats

### 4. **Missing Column Error** (Final Issue)
- **Error**: `"Could not find the 'scraped_at' column of 'markets'"`
- **Cause**: Pipeline was trying to insert `scraped_at` but table only has `created_at` and `updated_at`
- **Fix**: Removed `scraped_at` field from pipeline code

## Files Modified

### 1. **api/scrapy_project/scrapy_project/pipelines.py**
```python
# Before
market_name = item.get('name', 'Unknown')
market_data = dict(item)

# After
market_data = dict(item)
market_name = market_data.get('name', 'Unknown')
```

```python
# Before
existing = self.supabase.table('markets')\
    .select('loppemarkeder_nu')\
    .eq('external_id', market_data.get('external_id'))\
    .single().execute()

# After
try:
    existing = self.supabase.table('markets')\
        .select('loppemarkeder_nu')\
        .eq('external_id', market_data.get('external_id'))\
        .maybe_single().execute()
    # ... handle result
except Exception:
    old_meta = {}
```

```python
# Before
market_data['scraped_at'] = datetime.utcnow().isoformat()
for col in ['start_date','end_date','scraped_at']:
    raw_meta.pop(col, None)

# After
# Removed scraped_at entirely
for col in ['start_date','end_date','created_at','updated_at']:
    raw_meta.pop(col, None)
```

### 2. **api/scrapy_project/scrapy_project/spiders/loppemarkeder.py**
```python
# Before
item['name'] = ev.get('title', {}).get('rendered')
item['description'] = ev.get('description', {}).get('rendered')
item['category'] = ev.get('category', {}).get('name') if ev.get('category') else 'Loppemarked'

# After
title = ev.get('title', '')
item['name'] = title.get('rendered') if isinstance(title, dict) else title

description = ev.get('description', '')
item['description'] = description.get('rendered') if isinstance(description, dict) else description

category = ev.get('category')
if isinstance(category, dict):
    item['category'] = category.get('name', 'Loppemarked')
else:
    item['category'] = category if category else 'Loppemarked'
```

## Enhanced Logging Added

All the logging enhancements from `ENHANCED_LOGGING_GUIDE.md` remain intact:
- ✓ Visual separators with progress indicators
- ✓ Per-item success/failure tracking with `✓` and `✗` symbols
- ✓ Pipeline statistics (processed, success, failed, success rate)
- ✓ Execution time tracking
- ✓ Spider initialization and completion logging
- ✓ Detailed error messages with context

## Test Results

### Final Successful Run (2025-10-07 13:05:37)
```
✓ [1/1] Successfully upserted: Loppemarked – Onsdagsmarked – Vig
✓ [2/2] Successfully upserted: Nakskov Loppemarked
✓ [3/3] Successfully upserted: Loppemarked – Axeltorv ved Tivoli

Pipeline Statistics:
  Total items processed: 3
  Successfully saved: 3
  Failed: 0
  Success rate: 100.0%
```

### Database Verification
```sql
SELECT COUNT(*) FROM markets;  -- Returns: 3

SELECT name, category, start_date, end_date FROM markets LIMIT 3;
```

Results:
1. Loppemarked – Onsdagsmarked – Vig (2025-10-08)
2. Nakskov Loppemarked (2025-10-08)
3. Loppemarked – Axeltorv ved Tivoli (2025-10-10)

## How to Trigger Scraper

### Via API Endpoint
```bash
curl -X POST http://localhost:8080/scraper/trigger
```

### Via Docker Logs
```bash
docker compose logs api --follow
```

### View Scraper Logs
```bash
docker compose exec api cat scraper.log | tail -100
docker compose exec api grep "Successfully upserted" scraper.log
docker compose exec api grep "Pipeline Statistics" scraper.log -A 5
```

### Query Database
```bash
docker compose exec api python3 -c "
from supabase import create_client
import os
supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
result = supabase.table('markets').select('name').execute()
print(f'Total markets: {len(result.data)}')
for m in result.data:
    print(f'  - {m[\"name\"]}')
"
```

## Next Steps

1. ✅ **DONE**: Enhanced logging is working perfectly
2. ✅ **DONE**: Scraper successfully saves to database
3. ✅ **DONE**: Error handling improved with proper exception catching
4. ⏭️ **TODO**: Deploy to production (ECS with 2048MB memory)
5. ⏭️ **TODO**: Test both spiders (loppemarkeder and fleamarket)
6. ⏭️ **TODO**: Monitor production scraping for performance

## Known Limitations

1. **HTML Entities**: Market names contain HTML entities like `&#8211;` (should be decoded to `–`)
2. **Missing City Data**: Some markets don't have city information from the API
3. **Fleamarket Spider**: Limited to 10 markets for testing (increase `max_markets` for production)

## Deployment Notes

When deploying to production:
- Changes will be picked up automatically via GitHub Actions
- ECS task definition now uses 2048MB memory (previous OOM issues resolved)
- Scraper runs daily at 02:00 UTC via cron schedule
- Background task execution via FastAPI doesn't block API

## Success Metrics

- ✅ 100% success rate on test run
- ✅ 3 markets successfully scraped and saved
- ✅ Detailed logging output shows all processing steps
- ✅ Error handling catches and reports issues properly
- ✅ Database integration working correctly
