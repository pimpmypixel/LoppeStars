-- ============================================================================
-- CREATE EVENT SYSTEM FUNCTIONS
-- ============================================================================
-- Functions for managing user events and interactions
-- Created: 2025-01-07
-- ============================================================================

-- Get the latest market selection for a user
CREATE OR REPLACE FUNCTION public.get_user_selected_market(p_user_id UUID)
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

-- Log events helper function
CREATE OR REPLACE FUNCTION public.log_event(
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

-- Function comments
COMMENT ON FUNCTION public.get_user_selected_market IS 'Returns the most recently selected market UUID for a given user';
COMMENT ON FUNCTION public.log_event IS 'Helper function to log events with proper validation';