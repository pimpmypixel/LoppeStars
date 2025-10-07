-- ============================================================================
-- CREATE RLS POLICIES FOR MARKETS
-- ============================================================================
-- Row Level Security policies for markets table
-- Created: 2025-01-07
-- ============================================================================

-- Markets policies
CREATE POLICY "Everyone can read markets" ON public.markets 
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage markets" ON public.markets 
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage all markets" ON public.markets 
    FOR ALL USING (public.current_user_is_admin());