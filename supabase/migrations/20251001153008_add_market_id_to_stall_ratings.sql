-- Add market_id column to stall_ratings table (nullable)
ALTER TABLE public.stall_ratings
ADD COLUMN market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL;