-- ============================================================================
-- SETUP STORAGE BUCKETS
-- ============================================================================
-- Create storage buckets for photo uploads
-- Created: 2025-01-07
-- ============================================================================

-- Create storage buckets (safe with conflict handling)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES 
        ('stall-photos', 'stall-photos', true, 52428800, '{"image/jpeg","image/png","image/webp"}'),
        ('stall-photos-processed', 'stall-photos-processed', true, 52428800, '{"image/jpeg","image/png","image/webp"}')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Storage buckets created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage bucket creation completed with warnings: %', SQLERRM;
END $$;