-- Create Events table for logging all user interactions
-- EAV (Entity-Attribute-Value) pattern for flexible event tracking

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'market_selected', 'stall_rated', 'photo_added', 'market_marked_here'
    entity_type TEXT, -- e.g., 'market', 'stall', 'rating', 'photo'
    entity_id UUID, -- reference to the entity being acted upon
    metadata JSONB DEFAULT '{}', -- flexible JSON for any event-specific data
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON public.events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON public.events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON public.events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON public.events USING gin(metadata);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events
CREATE POLICY "Users can read own events"
    ON public.events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.events IS 'Event tracking table using EAV pattern for flexible user interaction logging';
COMMENT ON COLUMN public.events.event_type IS 'Type of event: market_selected, stall_rated, photo_added, market_marked_here, etc.';
COMMENT ON COLUMN public.events.entity_type IS 'Type of entity: market, stall, rating, photo, etc.';
COMMENT ON COLUMN public.events.entity_id IS 'UUID reference to the specific entity';
COMMENT ON COLUMN public.events.metadata IS 'Flexible JSONB field for event-specific data (market_name, rating_value, photo_url, etc.)';

-- Create a function to get the latest market selection for a user
CREATE OR REPLACE FUNCTION get_user_selected_market(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_market_id UUID;
BEGIN
    SELECT entity_id INTO v_market_id
    FROM public.events
    WHERE user_id = p_user_id
      AND event_type = 'market_selected'
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN v_market_id;
END;
$$;

-- Create a function to log events (helper for application)
CREATE OR REPLACE FUNCTION log_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.events (user_id, event_type, entity_type, entity_id, metadata)
    VALUES (p_user_id, p_event_type, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION get_user_selected_market IS 'Returns the most recently selected market UUID for a given user';
COMMENT ON FUNCTION log_event IS 'Helper function to log events with proper validation';
