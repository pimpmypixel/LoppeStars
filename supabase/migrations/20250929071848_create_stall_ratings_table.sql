-- Create stall ratings table
CREATE TABLE public.stall_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stall_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  mobilepay_phone VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_stall_ratings_updated_at
  BEFORE UPDATE ON public.stall_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create RLS policies
ALTER TABLE public.stall_ratings ENABLE ROW LEVEL SECURITY;

-- Users can read all stall ratings
CREATE POLICY "Users can read all stall ratings" ON public.stall_ratings
  FOR SELECT
  USING (true);

-- Users can insert their own stall ratings
CREATE POLICY "Users can insert their own stall ratings" ON public.stall_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stall ratings
CREATE POLICY "Users can update their own stall ratings" ON public.stall_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stall ratings
CREATE POLICY "Users can delete their own stall ratings" ON public.stall_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage buckets for stall photos (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('stall-photos', 'stall-photos', true, 52428800, '{"image/jpeg","image/png","image/webp"}'),
  ('stall-photos-processed', 'stall-photos-processed', true, 52428800, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for stall photos
CREATE POLICY "Users can upload stall photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all stall photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'stall-photos');

CREATE POLICY "Users can update their own stall photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own stall photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'stall-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for processed photos bucket
CREATE POLICY "Users can upload processed stall photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all processed stall photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'stall-photos-processed');

CREATE POLICY "Users can update their own processed stall photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own processed stall photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'stall-photos-processed' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
