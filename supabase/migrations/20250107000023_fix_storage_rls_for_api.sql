-- ============================================================================
-- FIX STORAGE RLS FOR API UPLOADS
-- ============================================================================
-- Allow API (using service role) to upload processed photos
-- Created: 2025-01-07
-- ============================================================================

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;

-- Recreate with service role bypass
-- Service role (used by API) should be able to upload processed photos
CREATE POLICY "Allow uploads to processed photos bucket" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos-processed' 
        AND (
            -- Allow authenticated users to upload to their own folder
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            -- Allow service role (API) to upload anywhere in this bucket
            auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow updates to processed photos" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'stall-photos-processed' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );

-- Also ensure the original stall-photos bucket allows service role
DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;

CREATE POLICY "Allow uploads to stall photos bucket" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow updates to stall photos" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'stall-photos' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );
