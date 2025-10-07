-- ============================================================================
-- CREATE RLS POLICIES FOR USER ROLES
-- ============================================================================
-- Row Level Security policies for user_roles table
-- Created: 2025-01-07
-- ============================================================================

-- User roles policies
CREATE POLICY "Admins can read user roles" ON public.user_roles
    FOR SELECT USING (public.current_user_is_admin());
CREATE POLICY "Users can read their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can grant roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Admins can revoke roles" ON public.user_roles
    FOR UPDATE USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());