-- Add rating_type column to stall_ratings table
-- This column will differentiate between 'stall' and 'market' ratings

ALTER TABLE stall_ratings 
ADD COLUMN rating_type VARCHAR(20) NOT NULL DEFAULT 'stall';

-- Add check constraint to ensure only valid rating types
ALTER TABLE stall_ratings 
ADD CONSTRAINT rating_type_check 
CHECK (rating_type IN ('stall', 'market'));

-- Create an index on rating_type for better query performance
CREATE INDEX idx_stall_ratings_type ON stall_ratings(rating_type);

-- Create an index on market_id and rating_type combination for market ratings
CREATE INDEX idx_stall_ratings_market_type ON stall_ratings(market_id, rating_type);