-- ============================================================================
-- CREATE RLS POLICIES FOR EVENTS
-- ============================================================================
-- Row Level Security policies for events table
-- Created: 2025-01-07
-- ============================================================================

-- Events policies
CREATE POLICY "Users can read own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all events" ON public.events 
    FOR SELECT USING (public.current_user_is_admin());