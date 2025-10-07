# Enhanced Scraper Logging Guide

## Overview
The scraper now includes comprehensive, detailed logging for each spider execution, making it easier to monitor progress, debug issues, and track performance metrics.

## What's New

### 1. Structured Log Output
- **Visual separators**: Clear section breaks using `=` and `-` characters
- **Timestamps**: ISO format timestamps for all major events
- **Counters**: Item counts, success/failure rates, spider progress
- **Statistics**: Execution time, items processed, success rates

### 2. Per-Spider Detailed Logging

#### scraper_cron.py Enhancements
```
================================================================================
Starting fleamarket scraper...
Timestamp: 2025-10-07T10:30:45.123456
================================================================================
Discovering available spiders...
Found 2 spider(s): loppemarkeder, fleamarket

--------------------------------------------------------------------------------
[1/2] Starting spider: 'loppemarkeder'
Spider start time: 10:30:45
--------------------------------------------------------------------------------
  [scrapy.core.engine] INFO: Spider opened
  [loppemarkeder] INFO: Parsing response from: https://loppemarkeder.nu/...
  [loppemarkeder] INFO: Found 47 events in response
  [loppemarkeder] ✓ [1/47] Successfully upserted: Loppemarked i København
  [loppemarkeder] ✓ [2/47] Successfully upserted: Genbrug og Loppemarkeder
  ...

Spider 'loppemarkeder' finished in 12.34 seconds
✓ Spider 'loppemarkeder' completed successfully
  Items scraped: 47
  Statistics:
    finish_reason: finished
    item_scraped_count: 47

--------------------------------------------------------------------------------
[2/2] Starting spider: 'fleamarket'
Spider start time: 10:31:00
--------------------------------------------------------------------------------
  [fleamarket] INFO: Initializing fleamarket spider (max_markets=10)
  [fleamarket] INFO: Parsing market listing page: https://markedskalenderen.dk/...
  [fleamarket] INFO: Found 156 table rows to process
  [fleamarket] INFO: [1/10] Visiting detail page: Loppemarked Roskilde
  [fleamarket] ✓ Yielding completed item #1: Loppemarked Roskilde
  ...

Spider 'fleamarket' finished in 45.67 seconds
✓ Spider 'fleamarket' completed successfully
  Items scraped: 10

================================================================================
Scraper run completed in 58.01 seconds (1.0 minutes)
End timestamp: 2025-10-07T10:31:43.123456
================================================================================
```

#### Pipeline Statistics
At the end of each spider run:
```
============================================================
Pipeline Statistics:
  Total items processed: 47
  Successfully saved: 47
  Failed: 0
  Success rate: 100.0%
============================================================
```

### 3. Individual Item Tracking

Each item now logs:
- **Processing number**: `✓ [23/47] Successfully upserted: Market Name`
- **Debug details**: Item extraction and processing steps (when DEBUG level enabled)
- **Error details**: `✗ [2 failed] Error processing 'Market Name': error details`

### 4. Spider-Level Logging

#### Loppemarkeder Spider
- JSON response parsing with event count
- Item yield counter with market names
- Total items yielded summary

#### Fleamarket Spider  
- Initialization with max_markets limit
- Table row count from listing pages
- Progress counter: `[3/10]` format
- Pagination tracking
- Detail page parsing per market
- Geocoding attempts and results

### 5. Error Handling & Debugging

**Error capture**:
- STDERR lines logged with `STDERR:` prefix
- Warning indicators for geocoding failures
- Last 10 error lines shown on failure
- Error count tracking

**Debugging tips**:
```bash
# Run with debug logging
cd api/scrapy_project
scrapy crawl loppemarkeder -L DEBUG

# Run with info logging (default)
scrapy crawl fleamarket -L INFO

# View only errors
python scraper_cron.py 2>&1 | grep -i error
```

## Configuration

### Scrapy Settings (settings.py)
```python
LOG_LEVEL = 'INFO'  # Change to 'DEBUG' for verbose output
LOG_FORMAT = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
LOG_DATEFORMAT = '%Y-%m-%d %H:%M:%S'
STATS_CLASS = 'scrapy.statscollectors.MemoryStatsCollector'
```

### Pipeline Tracking (pipelines.py)
- `items_processed`: Total items received
- `items_success`: Successfully saved to Supabase
- `items_failed`: Failed to save
- Auto-calculated success rate percentage

### Spider Counters
- `items_yielded`: Count per spider
- `markets_scraped`: Progress against `max_markets` (fleamarket only)

## Testing Locally

### Prerequisites
```bash
cd api
pip install -r requirements.txt
```

### Set Environment Variables
```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

### Run Single Spider
```bash
cd scrapy_project
scrapy crawl loppemarkeder -L INFO
```

### Run All Spiders (via cron script)
```bash
cd api
python scraper_cron.py
```

### Trigger via API
```bash
curl -X POST http://localhost:8080/scraper/trigger
# Check logs
tail -f scraper.log
```

## Output Locations

### Local Development
- **Console**: Real-time stdout/stderr
- **Log file**: `/app/scraper.log` (in Docker)
- **API endpoint**: Returns status with message

### AWS ECS Production
- **CloudWatch Logs**: `/ecs/loppestars` log group
- **Filter by spider**: Search for `[loppemarkeder]` or `[fleamarket]`
- **View stats**: Search for `Pipeline Statistics:`
- **Check errors**: Search for `✗` or `ERROR`

## Monitoring Tips

### Watch for Issues
```bash
# Monitor in real-time
tail -f scraper.log

# Check success rates
grep "Success rate:" scraper.log

# Find failed items
grep "✗" scraper.log

# Count items per spider
grep "Successfully upserted" scraper.log | wc -l
```

### Performance Metrics
- Look for spider duration times
- Compare items_scraped counts across runs
- Track success rate percentages
- Monitor timeout warnings (3600s limit)

### Common Issues
1. **No items scraped**: Check start_urls and allowed_domains
2. **High failure rate**: Review Supabase connection and schema
3. **Timeout**: Reduce max_markets or optimize selectors
4. **Geocoding errors**: API rate limiting (randomized user agents help)

## Benefits

✅ **Visibility**: See exactly what each spider is doing in real-time
✅ **Debugging**: Detailed error messages with context
✅ **Performance**: Execution times and item counts per spider
✅ **Reliability**: Success/failure tracking with rates
✅ **Production-Ready**: Structured logs for CloudWatch filtering
✅ **Developer-Friendly**: Clear visual formatting with Unicode symbols

## Unicode Symbols Used

- `✓` (U+2713): Success indicator
- `✗` (U+2717): Failure indicator  
- `═` (U+2550): Major section separator
- `─` (U+2500): Minor section separator

If these don't display correctly, they'll appear as ASCII approximations.
