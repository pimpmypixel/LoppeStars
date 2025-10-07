-- ============================================================================
-- CREATE TABLE TRIGGERS
-- ============================================================================
-- Apply updated_at triggers to tables
-- Created: 2025-01-07
-- ============================================================================

CREATE TRIGGER handle_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_markets_updated_at();

CREATE TRIGGER handle_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();