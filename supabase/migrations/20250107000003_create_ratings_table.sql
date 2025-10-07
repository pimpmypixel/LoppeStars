-- ============================================================================
-- CREATE RATINGS TABLE
-- ============================================================================
-- Store user ratings of market stalls, markets, and other entities
-- Created: 2025-01-07
-- ============================================================================

-- Ratings table: Store user ratings of market stalls, markets, and other entities
CREATE TABLE public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  stall_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  mobilepay_phone VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  rating_type VARCHAR(20) NOT NULL DEFAULT 'stall' CHECK (rating_type IN ('stall', 'market')),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ratings indexes
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX idx_ratings_market_id ON public.ratings(market_id);
CREATE INDEX idx_ratings_type ON public.ratings(rating_type);
CREATE INDEX idx_ratings_market_type ON public.ratings(market_id, rating_type);
CREATE INDEX idx_ratings_created_at ON public.ratings(created_at DESC);

-- Table comment
COMMENT ON TABLE public.ratings IS 'User ratings of market stalls, markets, and other entities';
COMMENT ON COLUMN public.ratings.rating_type IS 'Type of rating: stall or market';