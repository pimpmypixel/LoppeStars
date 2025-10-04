-- ============================================================================
-- MANUAL EVENTS TABLE SETUP
-- ============================================================================
-- Copy and paste this SQL into the Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql/new
-- ============================================================================

-- Step 1: Create Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON public.events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON public.events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON public.events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON public.events USING gin(metadata);

-- Step 3: Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Users can read own events" ON public.events;
CREATE POLICY "Users can read own events"
    ON public.events
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Step 5: Add comments
COMMENT ON TABLE public.events IS 'Event tracking table using EAV pattern for flexible user interaction logging';
COMMENT ON COLUMN public.events.event_type IS 'Type of event: market_selected, stall_rated, photo_added, market_marked_here, etc.';
COMMENT ON COLUMN public.events.entity_type IS 'Type of entity: market, stall, rating, photo, etc.';
COMMENT ON COLUMN public.events.entity_id IS 'UUID reference to the specific entity';
COMMENT ON COLUMN public.events.metadata IS 'Flexible JSONB field for event-specific data';

-- Step 6: Create helper functions
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

-- Step 7: Verify installation
SELECT 'Events table created successfully!' as status;
SELECT COUNT(*) as event_count FROM public.events;
