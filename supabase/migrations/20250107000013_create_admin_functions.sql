-- ============================================================================
-- CREATE ADMIN FUNCTIONS
-- ============================================================================
-- Admin-specific functions for system operations
-- Created: 2025-01-07
-- ============================================================================

-- Manual scraper trigger function for admins
CREATE OR REPLACE FUNCTION public.trigger_scraper_manually()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN    
    -- Check if current user is admin
    IF NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can trigger the scraper manually';
    END IF;

    -- Call the Edge Function directly
    SELECT net.http_post(
        url:='https://oprevwbturtujbugynct.supabase.co/functions/v1/trigger-scraper',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'token' || '"}'::jsonb,
        body:='{}'::jsonb
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function comment
COMMENT ON FUNCTION public.trigger_scraper_manually IS 'Manually trigger the scraper (admin only operation)';