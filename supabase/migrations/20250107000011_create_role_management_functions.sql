-- ============================================================================
-- CREATE ROLE MANAGEMENT FUNCTIONS
-- ============================================================================
-- Functions for granting and revoking user roles (admin only operations)
-- Created: 2025-01-07
-- ============================================================================

-- Grant a role to a user (admin only operation)
CREATE OR REPLACE FUNCTION public.grant_user_role(
    target_user_id UUID,
    role_to_grant TEXT,
    notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_record_id UUID;
    current_user_id UUID;
    current_user_is_admin BOOLEAN;
BEGIN
    -- Validate role
    IF role_to_grant NOT IN ('visitor', 'seller', 'organiser', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be one of: visitor, seller, organiser, admin', role_to_grant;
    END IF;

    current_user_id := auth.uid();
    current_user_is_admin := public.current_user_is_admin();
    
    -- Check permissions: only admins can grant roles
    IF NOT current_user_is_admin THEN
        RAISE EXCEPTION 'Only admins can grant user roles';
    END IF;
    
    -- Check if target user already has active role
    IF public.user_has_role(target_user_id, role_to_grant) THEN
        RAISE EXCEPTION 'User already has % role', role_to_grant;
    END IF;

    -- Grant role
    INSERT INTO public.user_roles (user_id, role, granted_by, notes)
    VALUES (target_user_id, role_to_grant, current_user_id, notes)
    RETURNING id INTO role_record_id;

    RETURN role_record_id;
END;
$$;

-- Backward compatibility function for granting admin rights
CREATE OR REPLACE FUNCTION public.grant_admin_rights(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.grant_user_role(target_user_id, 'admin', notes);
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.grant_user_role IS 'Grant a role to a user (admin only operation). Users can have multiple roles simultaneously.';
COMMENT ON FUNCTION public.grant_admin_rights IS 'Grant admin rights to a user (backward compatibility wrapper)';