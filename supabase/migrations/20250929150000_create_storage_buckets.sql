-- Create storage buckets for photos (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('stall-photos', 'stall-photos', true, 52428800, '{"image/jpeg","image/png","image/webp"}'),
  ('stall-photos-processed', 'stall-photos-processed', true, 52428800, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage buckets
CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'stall-photos');

CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for processed photos bucket
CREATE POLICY "Users can upload their own processed photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all processed photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'stall-photos-processed');

CREATE POLICY "Users can update their own processed photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own processed photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[1]);