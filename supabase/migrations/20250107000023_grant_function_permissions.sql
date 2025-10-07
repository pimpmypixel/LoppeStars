-- ============================================================================
-- GRANT FUNCTION PERMISSIONS
-- ============================================================================
-- Grant execution permissions on functions to authenticated users
-- Created: 2025-01-07
-- ============================================================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_seller TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_organiser TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_rights TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_rights TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_scraper_manually TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_selected_market TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_event TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;