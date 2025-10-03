-- Create Edge Function registry table for send-scrape-status logs
CREATE TABLE IF NOT EXISTS public.send_scrape_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emails TEXT[] NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);