-- Drop existing storage policies for stall-photos
DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stall photos" ON storage.objects;

-- Drop existing storage policies for stall-photos-processed
DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own processed stall photos" ON storage.objects;

-- Recreate storage policies for stall photos with correct folder indexing
CREATE POLICY "Users can upload stall photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );

CREATE POLICY "Users can view all stall photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'stall-photos');

CREATE POLICY "Users can update their own stall photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );

CREATE POLICY "Users can delete their own stall photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );

-- Recreate storage policies for processed photos bucket with correct folder indexing
CREATE POLICY "Users can upload processed stall photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );

CREATE POLICY "Users can view all processed stall photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'stall-photos-processed');

CREATE POLICY "Users can update their own processed stall photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );

CREATE POLICY "Users can delete their own processed stall photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[0]
  );