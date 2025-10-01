-- Create markets table for scraped fleamarket data
CREATE TABLE public.markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE, -- ID from the scraping source
  name VARCHAR(500) NOT NULL,
  municipality VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Loppemarked',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
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
  opening_hours TEXT, -- JSON string with hours for each day
  entry_fee DECIMAL(8, 2),
  stall_count INTEGER,
  has_food BOOLEAN DEFAULT false, -- Based on icon 
  has_parking BOOLEAN DEFAULT false, -- Based on icon 
  has_toilets BOOLEAN DEFAULT false,
  has_wifi BOOLEAN DEFAULT false,
  is_indoor BOOLEAN DEFAULT false,
  is_outdoor BOOLEAN DEFAULT true,
  special_features TEXT, -- JSON string with additional features
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger
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

-- Create indexes for performance
CREATE INDEX idx_markets_start_date ON public.markets(start_date);
CREATE INDEX idx_markets_end_date ON public.markets(end_date);
CREATE INDEX idx_markets_municipality ON public.markets(municipality);
CREATE INDEX idx_markets_location ON public.markets(latitude, longitude);
CREATE INDEX idx_markets_external_id ON public.markets(external_id);
CREATE INDEX idx_markets_organizer_name ON public.markets(organizer_name);

-- Create RLS policies
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Everyone can read markets
CREATE POLICY "Everyone can read markets" ON public.markets
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update markets (for admin purposes)
CREATE POLICY "Authenticated users can manage markets" ON public.markets
  FOR ALL
  USING (auth.role() = 'authenticated');