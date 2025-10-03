-- Cleanup existing schema
DROP TRIGGER IF EXISTS handle_stall_ratings_updated_at ON public.stall_ratings;
DROP TRIGGER IF EXISTS handle_markets_updated_at ON public.markets;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_markets_updated_at() CASCADE;
DROP TABLE IF EXISTS public.stall_ratings CASCADE;
DROP TABLE IF EXISTS public.markets CASCADE;

-- Cleanup existing storage policies
DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stall photos" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own processed stall photos" ON storage.objects;

-- Initial consolidated schema follows
CREATE TABLE public.markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE,
  name VARCHAR(500) NOT NULL,
  municipality VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Loppemarked',
  start_date DATE,
  end_date DATE,
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  organizer_name VARCHAR(255),
  organizer_phone VARCHAR(50),
  organizer_email VARCHAR(255),
  organizer_website TEXT,
  opening_hours TEXT,
  entry_fee DECIMAL(8, 2),
  stall_count INTEGER,
  has_food BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_toilets BOOLEAN DEFAULT false,
  has_wifi BOOLEAN DEFAULT false,
  is_indoor BOOLEAN DEFAULT false,
  is_outdoor BOOLEAN DEFAULT true,
  special_features TEXT,
  source_url TEXT,
  loppemarkeder_nu JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_markets_updated_at();

CREATE INDEX idx_markets_start_date ON public.markets(start_date);
CREATE INDEX idx_markets_end_date ON public.markets(end_date);
CREATE INDEX idx_markets_municipality ON public.markets(municipality);
CREATE INDEX idx_markets_location ON public.markets(latitude, longitude);
CREATE INDEX idx_markets_external_id ON public.markets(external_id);
CREATE INDEX idx_markets_organizer_name ON public.markets(organizer_name);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage markets" ON public.markets FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE public.stall_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  stall_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  mobilepay_phone VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

ALTER TABLE public.stall_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all stall ratings" ON public.stall_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stall ratings" ON public.stall_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stall ratings" ON public.stall_ratings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stall ratings" ON public.stall_ratings FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stall-photos', 'stall-photos', true, 52428800, '{"image/jpeg","image/png","image/webp"}'), ('stall-photos-processed', 'stall-photos-processed', true, 52428800, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload stall photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
CREATE POLICY "Users can view all stall photos" ON storage.objects FOR SELECT USING (bucket_id = 'stall-photos');
CREATE POLICY "Users can update their own stall photos" ON storage.objects FOR UPDATE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
CREATE POLICY "Users can delete their own stall photos" ON storage.objects FOR DELETE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);

CREATE POLICY "Users can upload processed stall photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
CREATE POLICY "Users can view all processed stall photos" ON storage.objects FOR SELECT USING (bucket_id = 'stall-photos-processed');
CREATE POLICY "Users can update their own processed stall photos" ON storage.objects FOR UPDATE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
CREATE POLICY "Users can delete their own processed stall photos" ON storage.objects FOR DELETE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);