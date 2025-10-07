-- ============================================================================
-- CREATE ROLE SYSTEM FUNCTIONS
-- ============================================================================
-- Core role checking and management functions for user roles system
-- Created: 2025-01-07
-- ============================================================================

-- Check if a user has a specific role (with admin as default for backward compatibility)
-- This function checks multiple methods:
-- 1. ADMIN_EMAIL environment variable match (for admin role only)
-- 2. user_roles table (for granted roles)
-- 3. App metadata roles (fallback)
-- 4. First user (fallback for admin role only)
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID DEFAULT auth.uid(), required_role TEXT DEFAULT 'admin')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_email TEXT;
    admin_email TEXT;
    user_metadata JSONB;
    first_user_id UUID;
    role_record_exists BOOLEAN;
BEGIN
    -- Return false if no user_id provided
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Validate role
    IF required_role NOT IN ('visitor', 'seller', 'organiser', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be one of: visitor, seller, organiser, admin', required_role;
    END IF;

    -- Get user email
    SELECT email INTO user_email
    FROM auth.users 
    WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Method 1: Check ADMIN_EMAIL environment variable (admin role only)
    IF required_role = 'admin' THEN
        admin_email := 'pimpmypixelcph@gmail.com'; -- This should match ADMIN_EMAIL from .env
        
        IF user_email = admin_email THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Method 2: Check user_roles table for granted role
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_has_role.user_id 
        AND role = required_role
        AND revoked_at IS NULL
    ) INTO role_record_exists;
    
    IF role_record_exists THEN
        RETURN TRUE;
    END IF;

    -- Method 3: Check app_metadata for role (fallback)
    SELECT raw_app_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = user_id;
    
    IF user_metadata ? 'roles' AND user_metadata->'roles' ? required_role THEN
        RETURN TRUE;
    END IF;

    -- Method 4: Check if user is the first registered user (admin role only, fallback)
    IF required_role = 'admin' THEN
        SELECT id INTO first_user_id
        FROM auth.users
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF first_user_id = user_id THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Role not found
    RETURN FALSE;
END;
$$;

-- Backward compatibility function for admin checks
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.user_has_role(user_id, 'admin');
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.user_has_role IS 'Check if a user has a specific role using ADMIN_EMAIL (for admin), user_roles table, app_metadata, or first user fallback (for admin)';
COMMENT ON FUNCTION public.user_is_admin IS 'Check if a user has admin privileges (backward compatibility wrapper)';