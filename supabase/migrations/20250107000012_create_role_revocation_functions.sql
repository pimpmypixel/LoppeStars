-- ============================================================================
-- CREATE ROLE REVOCATION FUNCTIONS
-- ============================================================================
-- Functions for revoking user roles with safety protections
-- Created: 2025-01-07
-- ============================================================================

-- Revoke a role from a user (admin only operation)
CREATE OR REPLACE FUNCTION public.revoke_user_role(
    target_user_id UUID,
    role_to_revoke TEXT,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    first_user_id UUID;
    current_user_is_admin BOOLEAN;
BEGIN
    -- Validate role
    IF role_to_revoke NOT IN ('visitor', 'seller', 'organiser', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be one of: visitor, seller, organiser, admin', role_to_revoke;
    END IF;

    current_user_id := auth.uid();
    current_user_is_admin := public.current_user_is_admin();
    
    -- Check permissions: only admins can revoke roles
    IF NOT current_user_is_admin THEN
        RAISE EXCEPTION 'Only admins can revoke user roles';
    END IF;

    -- Special protections for admin role
    IF role_to_revoke = 'admin' THEN
        -- Prevent revoking admin rights from the ADMIN_EMAIL user
        DECLARE
            target_email TEXT;
            admin_email TEXT;
        BEGIN
            SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
            admin_email := 'pimpmypixelcph@gmail.com'; -- This should match ADMIN_EMAIL
            
            IF target_email = admin_email THEN
                RAISE EXCEPTION 'Cannot revoke admin rights from the primary admin email';
            END IF;
        END;

        -- Prevent first user from revoking their own admin rights (safety measure)
        IF target_user_id = current_user_id THEN
            BEGIN
                SELECT id INTO first_user_id
                FROM auth.users
                ORDER BY created_at ASC
                LIMIT 1;
                
                IF first_user_id = target_user_id THEN
                    RAISE EXCEPTION 'First user cannot revoke their own admin rights';
                END IF;
            END;
        END IF;
    END IF;

    -- Update role record to mark as revoked
    UPDATE public.user_roles 
    SET 
        revoked_at = NOW(),
        revoked_by = current_user_id,
        notes = COALESCE(notes, role_to_revoke || ' role revoked'),
        updated_at = NOW()
    WHERE user_id = target_user_id 
    AND role = role_to_revoke
    AND revoked_at IS NULL;

    RETURN FOUND;
END;
$$;

-- Backward compatibility function for revoking admin rights
CREATE OR REPLACE FUNCTION public.revoke_admin_rights(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.revoke_user_role(target_user_id, 'admin', notes);
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.revoke_user_role IS 'Revoke a role from a user (admin only operation). Users can have multiple roles simultaneously.';
COMMENT ON FUNCTION public.revoke_admin_rights IS 'Revoke admin rights from a user (backward compatibility wrapper)';