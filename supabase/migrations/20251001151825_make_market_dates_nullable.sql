-- Make start_date and end_date nullable in markets table
ALTER TABLE public.markets ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.markets ALTER COLUMN end_date DROP NOT NULL;