# Fleamarket Scraper

This directory contains the scraping infrastructure for collecting fleamarket data from markedskalenderen.dk.

## Components

### Scrapy Spider (`scrapy_project/`)
- **Location**: `scrapy_project/scrapy_project/spiders/fleamarket.py`
- **Purpose**: Scrapes fleamarket listings from https://markedskalenderen.dk/marked/kategori/loppemarked
- **Data extracted**:
  - Market name
  - Municipality
  - Date range (start/end dates)
  - Features (food, parking based on icons)
  - Source URL

### Supabase Pipeline (`scrapy_project/scrapy_project/pipelines.py`)
- **Purpose**: Processes scraped items and stores them in Supabase
- **Features**:
  - Upserts market data using external_id as conflict resolution
  - Adds scraped_at timestamp
  - Error handling and logging

### Cron Script (`scraper_cron.py`)
- **Purpose**: Runs the scraper daily at 2 AM
- **Features**:
  - Scheduled execution using Python schedule library
  - Logging to `/app/logs/scraper.log`
  - Error handling and automatic retries
  - Runs immediately on startup for initial data population

### FastAPI Endpoints (`main.py`)
- **GET /markets/today**: Get markets happening today
  - Optional: `latitude`, `longitude` for distance calculation
  - Optional: `limit` (default: 50)
- **GET /markets/nearby**: Get markets within radius
  - Required: `latitude`, `longitude`
  - Optional: `radius_km` (default: 50), `days_ahead` (default: 30), `limit` (default: 50)
- **GET /markets/search**: Search markets by name or municipality
  - Required: `query`
  - Optional: `limit` (default: 20)

### Supabase Edge Function (`supabase/functions/get-markets/`)
- **Purpose**: Serverless API endpoints for market data
- **Same endpoints as FastAPI** but deployed as Supabase Edge Functions

## Database Schema

The `markets` table includes:
- `external_id`: Unique identifier from scraping source
- `name`: Market name
- `municipality`: Danish municipality
- `start_date`/`end_date`: Market date range
- `address`/`city`/`postal_code`: Location details
- `latitude`/`longitude`: Geographic coordinates
- `description`: Market description
- `organizer_name`/`organizer_phone`/`organizer_email`/`organizer_website`: Contact info
- `opening_hours`: Hours of operation (JSON string)
- `entry_fee`: Cost to enter
- `stall_count`: Number of stalls
- `has_food`/`has_parking`/`has_toilets`/`has_wifi`: Boolean amenities
- `is_indoor`/`is_outdoor`: Venue type
- `special_features`: Additional features (JSON string)
- `source_url`: Original listing URL
- `scraped_at`: Last scraping timestamp

## Running the Scraper

### Manual Execution
```bash
cd scrapy_project
scrapy crawl fleamarket
```

### Automated (via cron)
The scraper runs automatically daily at 2 AM when the Docker container is running.

### Environment Variables Required
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## Data Flow

1. **Scrapy Spider** extracts market data from website
2. **Supabase Pipeline** processes and stores data in database
3. **FastAPI/Edge Functions** serve data to mobile app
4. **Cron job** ensures daily updates

## Future Enhancements

- Add geographic coordinates for markets
- Extract detailed market descriptions
- Add market organizer contact information
- Implement market photo scraping
- Add market categories and tags