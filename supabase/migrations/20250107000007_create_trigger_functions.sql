-- ============================================================================
-- CREATE TRIGGER FUNCTIONS
-- ============================================================================
-- Generic trigger functions for updating timestamps
-- Created: 2025-01-07
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Markets-specific updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;