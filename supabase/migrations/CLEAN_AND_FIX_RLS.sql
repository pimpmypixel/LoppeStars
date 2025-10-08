-- ============================================================================
-- CLEAN AND FIX STORAGE RLS FOR API UPLOADS
-- ============================================================================
-- This script safely drops ALL existing policies and recreates them cleanly
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop ALL existing storage policies (including any duplicates)
-- This ensures a clean slate
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%stall%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Also drop the specific policies we're about to create (in case they exist)
DROP POLICY IF EXISTS "Allow uploads to processed photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to processed photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to stall photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to processed photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to stall photos" ON storage.objects;

-- Step 3: Create new policies with service role support
-- These allow BOTH authenticated users AND the API (service role)

-- Processed photos bucket policies
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

CREATE POLICY "Allow public read access to processed photos" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'stall-photos-processed'
    );

-- Original stall photos bucket policies
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

CREATE POLICY "Allow public read access to stall photos" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'stall-photos'
    );

-- Step 4: Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%stall%' OR policyname LIKE '%processed%')
ORDER BY policyname;
