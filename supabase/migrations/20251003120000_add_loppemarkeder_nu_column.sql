-- Add JSONB column to store raw metadata from loppemarkeder.nu
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS loppemarkeder_nu JSONB;