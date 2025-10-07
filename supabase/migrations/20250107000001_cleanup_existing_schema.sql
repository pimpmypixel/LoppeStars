-- ============================================================================
-- CLEANUP EXISTING SCHEMA
-- ============================================================================
-- Safe cleanup of existing database objects with proper error handling
-- Created: 2025-01-07
-- ============================================================================

-- Safe cleanup with proper error handling
DO $$
BEGIN
    -- Drop existing triggers (safe with IF EXISTS)
    DROP TRIGGER IF EXISTS handle_ratings_updated_at ON public.ratings;
    DROP TRIGGER IF EXISTS handle_stall_ratings_updated_at ON public.stall_ratings;
    DROP TRIGGER IF EXISTS handle_markets_updated_at ON public.markets;
    
    -- Drop existing functions (safe with CASCADE)
    DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_markets_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.user_is_admin(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.current_user_is_admin() CASCADE;
    DROP FUNCTION IF EXISTS public.grant_admin_rights(UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.revoke_admin_rights(UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.trigger_scraper_manually() CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_selected_market(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.log_event(UUID, TEXT, TEXT, UUID, JSONB) CASCADE;

    -- Drop existing tables (safe with IF EXISTS and CASCADE)
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.admin_users CASCADE;
    DROP TABLE IF EXISTS public.ratings CASCADE;
    DROP TABLE IF EXISTS public.stall_ratings CASCADE;
    DROP TABLE IF EXISTS public.markets CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.scraping_logs CASCADE;
    DROP TABLE IF EXISTS public.send_scrape_status_logs CASCADE;

    RAISE NOTICE 'Schema cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Schema cleanup completed with warnings: %', SQLERRM;
END $$;

-- Drop existing storage policies (safe with IF EXISTS)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view all stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view all processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own processed stall photos" ON storage.objects;
    
    RAISE NOTICE 'Storage policies cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policies cleanup completed with warnings: %', SQLERRM;
END $$;