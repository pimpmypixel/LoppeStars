-- ============================================================================
-- CREATE MARKETS TABLE
-- ============================================================================
-- Store flea market information with comprehensive metadata
-- Created: 2025-01-07
-- ============================================================================

-- Markets table: Store flea market information
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

-- Markets indexes
CREATE INDEX idx_markets_start_date ON public.markets(start_date);
CREATE INDEX idx_markets_end_date ON public.markets(end_date);
CREATE INDEX idx_markets_municipality ON public.markets(municipality);
CREATE INDEX idx_markets_location ON public.markets(latitude, longitude);
CREATE INDEX idx_markets_external_id ON public.markets(external_id);
CREATE INDEX idx_markets_organizer_name ON public.markets(organizer_name);

-- Table comment
COMMENT ON TABLE public.markets IS 'Flea markets with detailed information and metadata';