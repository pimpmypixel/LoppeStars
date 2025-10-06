-- Add rating_type column to distinguish between stall and market ratings
-- This migration only adds the new column, assuming the table already exists

-- Check if the column doesn't already exist before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stall_ratings' 
        AND column_name = 'rating_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.stall_ratings
        ADD COLUMN rating_type VARCHAR(20) NOT NULL DEFAULT 'stall' CHECK (rating_type IN ('stall', 'market'));
        
        -- Create indexes for better query performance
        CREATE INDEX idx_stall_ratings_rating_type ON public.stall_ratings(rating_type);
        CREATE INDEX idx_stall_ratings_market_id_rating_type ON public.stall_ratings(market_id, rating_type);
    END IF;
END $$;