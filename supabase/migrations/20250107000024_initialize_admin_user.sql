-- ============================================================================
-- INITIALIZE ADMIN USER
-- ============================================================================
-- Initialize admin user from ADMIN_EMAIL environment variable
-- Created: 2025-01-07
-- ============================================================================

-- Initialize admin user if ADMIN_EMAIL user exists
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'pimpmypixelcph@gmail.com'; -- This should match ADMIN_EMAIL
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    -- If admin user exists and doesn't have admin role, create one
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role, granted_by, notes)
        VALUES (admin_user_id, 'admin', admin_user_id, 'Initial admin setup from ADMIN_EMAIL')
        ON CONFLICT (user_id, role, granted_at) DO NOTHING;
        
        RAISE NOTICE 'Admin user initialized: %', admin_email;
    ELSE
        RAISE NOTICE 'Admin user not found: %', admin_email;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Admin initialization completed with warnings: %', SQLERRM;
END $$;