-- ============================================================================
-- CREATE CONVENIENCE ROLE FUNCTIONS
-- ============================================================================
-- Convenience functions for checking current user roles
-- Created: 2025-01-07
-- ============================================================================

-- Convenience functions for current user role checks
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.user_has_role(auth.uid(), required_role);
END;
$$;

-- Backward compatibility function for admin checks
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.user_has_role(auth.uid(), 'admin');
END;
$$;

-- Additional convenience functions for specific roles
CREATE OR REPLACE FUNCTION public.current_user_is_seller()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.user_has_role(auth.uid(), 'seller');
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_organiser()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.user_has_role(auth.uid(), 'organiser');
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.current_user_has_role IS 'Check if the current authenticated user has a specific role';
COMMENT ON FUNCTION public.current_user_is_admin IS 'Check if the current authenticated user has admin privileges';
COMMENT ON FUNCTION public.current_user_is_seller IS 'Check if the current authenticated user has seller privileges';
COMMENT ON FUNCTION public.current_user_is_organiser IS 'Check if the current authenticated user has organiser privileges';