-- Temporarily allow all authenticated users to upload to stall-photos for testing
DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;

CREATE POLICY "Temp allow all authenticated uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos' AND
    auth.uid() IS NOT NULL
  );

-- Temporarily allow all authenticated users to upload to stall-photos-processed for testing
DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;

CREATE POLICY "Temp allow all authenticated uploads processed" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos-processed' AND
    auth.uid() IS NOT NULL
  );