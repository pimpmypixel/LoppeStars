-- ============================================================================
-- CREATE EVENTS TABLE
-- ============================================================================
-- Track user interactions using EAV pattern for flexible event logging
-- Created: 2025-01-07
-- ============================================================================

-- Events table: Track user interactions (EAV pattern)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'market_selected', 'stall_rated', 'photo_added', etc.
    entity_type TEXT, -- 'market', 'stall', 'rating', 'photo'
    entity_id UUID, -- reference to the entity being acted upon
    metadata JSONB DEFAULT '{}', -- flexible JSON for event-specific data
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events indexes
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_entity_type ON public.events(entity_type);
CREATE INDEX idx_events_entity_id ON public.events(entity_id);
CREATE INDEX idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX idx_events_user_timestamp ON public.events(user_id, timestamp DESC);
CREATE INDEX idx_events_metadata ON public.events USING gin(metadata);

-- Table and column comments
COMMENT ON TABLE public.events IS 'Event tracking table using EAV pattern for flexible user interaction logging';
COMMENT ON COLUMN public.events.event_type IS 'Type of event: market_selected, stall_rated, photo_added, market_marked_here, etc.';
COMMENT ON COLUMN public.events.entity_type IS 'Type of entity: market, stall, rating, photo, etc.';
COMMENT ON COLUMN public.events.entity_id IS 'UUID reference to the specific entity';
COMMENT ON COLUMN public.events.metadata IS 'Flexible JSONB field for event-specific data (market_name, rating_value, photo_url, etc.)';