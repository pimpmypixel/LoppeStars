-- ============================================================================
-- AUTO ADMIN ASSIGNMENT TRIGGER
-- ============================================================================
-- Automatically assign admin role to users with ADMIN_EMAIL on signup
-- Created: 2025-01-07
-- ============================================================================

-- Function to handle new user signup and auto-assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_assignment()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT := 'pimpmypixelcph@gmail.com'; -- This should match ADMIN_EMAIL from .env
BEGIN
    -- Check if the new user has the admin email
    IF NEW.email = admin_email THEN
        -- Insert admin role for the new user
        INSERT INTO public.user_roles (user_id, role, granted_by, notes)
        VALUES (
            NEW.id, 
            'admin', 
            NEW.id, 
            'Auto-assigned admin role on signup for ADMIN_EMAIL'
        )
        ON CONFLICT (user_id, role, granted_at) DO NOTHING;
        
        -- Log the admin assignment
        RAISE NOTICE 'Admin role auto-assigned to new user: %', NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup process
        RAISE WARNING 'Failed to auto-assign admin role for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to auto-assign admin role
-- Note: This trigger runs after a new user is inserted
DROP TRIGGER IF EXISTS trigger_auto_admin_assignment ON auth.users;
CREATE TRIGGER trigger_auto_admin_assignment
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_admin_assignment();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_admin_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_admin_assignment() TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_admin_assignment() IS 'Automatically assigns admin role to users with ADMIN_EMAIL on signup';
COMMENT ON TRIGGER trigger_auto_admin_assignment ON auth.users IS 'Auto-assigns admin role to ADMIN_EMAIL user on signup';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Auto admin assignment trigger created successfully';
END $$;