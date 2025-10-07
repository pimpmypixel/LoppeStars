-- ============================================================================
-- CREATE RLS POLICIES FOR RATINGS
-- ============================================================================
-- Row Level Security policies for ratings table
-- Created: 2025-01-07
-- ============================================================================

-- Ratings policies
CREATE POLICY "Users can read all ratings" ON public.ratings 
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own ratings" ON public.ratings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.ratings 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.ratings 
    FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all ratings" ON public.ratings 
    FOR ALL USING (public.current_user_is_admin());