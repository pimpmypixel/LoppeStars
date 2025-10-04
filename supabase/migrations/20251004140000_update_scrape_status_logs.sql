-- Update scrape_status_logs table to match new edge function structure
-- Rename table if it exists with old name
ALTER TABLE IF EXISTS public.send_scrape_status_logs RENAME TO scrape_status_logs;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scrape_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emails TEXT[] DEFAULT '{}',
  summary JSONB NOT NULL,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  scrape_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scrape_status_logs' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.scrape_status_logs ADD COLUMN status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scrape_status_logs' 
    AND column_name = 'scrape_date'
  ) THEN
    ALTER TABLE public.scrape_status_logs ADD COLUMN scrape_date TIMESTAMPTZ;
  END IF;
END $$;

-- Make emails optional (nullable)
ALTER TABLE public.scrape_status_logs ALTER COLUMN emails DROP NOT NULL;
ALTER TABLE public.scrape_status_logs ALTER COLUMN emails SET DEFAULT '{}';

-- Add index for querying by status and date
CREATE INDEX IF NOT EXISTS idx_scrape_status_logs_status ON public.scrape_status_logs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_status_logs_created_at ON public.scrape_status_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_status_logs_scrape_date ON public.scrape_status_logs(scrape_date DESC);

-- Add comment
COMMENT ON TABLE public.scrape_status_logs IS 'Logs from market scraper runs via send-scrape-status edge function';
