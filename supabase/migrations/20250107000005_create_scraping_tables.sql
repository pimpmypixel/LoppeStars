-- ============================================================================
-- CREATE SCRAPING TABLES
-- ============================================================================
-- Tables for tracking scraping operations and notifications
-- Created: 2025-01-07
-- ============================================================================

-- Scraping logs table: Track scraping operations
CREATE TABLE public.scraping_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    success BOOLEAN NOT NULL,
    message TEXT NOT NULL,
    output TEXT,
    error_details TEXT,
    scraped_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edge Function logs table: Track send-scrape-status function calls
CREATE TABLE public.send_scrape_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emails TEXT[] NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scraping logs indexes
CREATE INDEX idx_scraping_logs_scraped_at ON public.scraping_logs(scraped_at DESC);
CREATE INDEX idx_scraping_logs_success ON public.scraping_logs(success);

-- Table comments
COMMENT ON TABLE public.scraping_logs IS 'Logs from automated scraping operations';
COMMENT ON TABLE public.send_scrape_status_logs IS 'Logs from scrape status notification function calls';