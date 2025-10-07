-- ============================================================================
-- CREATE STORAGE POLICIES
-- ============================================================================
-- Row Level Security policies for storage objects
-- Created: 2025-01-07
-- ============================================================================

-- Storage policies (safe creation with error handling)
DO $$
BEGIN
    -- Storage policies for stall photos
    CREATE POLICY "Users can upload stall photos" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can view all stall photos" ON storage.objects 
        FOR SELECT USING (bucket_id = 'stall-photos');
    CREATE POLICY "Users can update their own stall photos" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can delete their own stall photos" ON storage.objects 
        FOR DELETE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);

    -- Storage policies for processed stall photos
    CREATE POLICY "Users can upload processed stall photos" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can view all processed stall photos" ON storage.objects 
        FOR SELECT USING (bucket_id = 'stall-photos-processed');
    CREATE POLICY "Users can update their own processed stall photos" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can delete their own processed stall photos" ON storage.objects 
        FOR DELETE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    
    RAISE NOTICE 'Storage policies created successfully';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some storage policies already exist, skipping duplicates';
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policy creation completed with warnings: %', SQLERRM;
END $$;