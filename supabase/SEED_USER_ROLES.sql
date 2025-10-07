-- ============================================================================
-- SEED USER ROLES TABLE - SUPABASE CLOUD
-- ============================================================================
-- Execute this script AFTER the main migration to add sample role data
-- Only run this if you need additional test users beyond the admin
-- ============================================================================

-- Note: This script requires actual user UUIDs from auth.users table
-- Replace the UUIDs below with real user IDs from your Supabase Auth users

-- Example: Grant seller role to a test user
-- INSERT INTO public.user_roles (user_id, role, granted_by, notes)
-- VALUES (
--     'REPLACE_WITH_ACTUAL_USER_UUID', 
--     'seller', 
--     (SELECT id FROM auth.users WHERE email = 'pimpmypixelcph@gmail.com' LIMIT 1),
--     'Test seller role for development'
-- );

-- Example: Grant organiser role to a test user  
-- INSERT INTO public.user_roles (user_id, role, granted_by, notes)
-- VALUES (
--     'REPLACE_WITH_ACTUAL_USER_UUID',
--     'organiser',
--     (SELECT id FROM auth.users WHERE email = 'pimpmypixelcph@gmail.com' LIMIT 1),
--     'Test organiser role for development'
-- );

-- View current users (for getting UUIDs to use above)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
ORDER BY created_at DESC;

-- View current user roles
SELECT 
    ur.id,
    u.email,
    ur.role,
    ur.granted_at,
    ur.revoked_at,
    ur.notes,
    CASE WHEN ur.revoked_at IS NULL THEN 'ACTIVE' ELSE 'REVOKED' END as status
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.granted_at DESC;

-- Test role functions
SELECT 
    'Admin check for pimpmypixelcph@gmail.com' as test_name,
    public.user_has_role(
        (SELECT id FROM auth.users WHERE email = 'pimpmypixelcph@gmail.com' LIMIT 1),
        'admin'
    ) as has_admin_role;

-- ============================================================================
-- SEEDING INSTRUCTIONS
-- ============================================================================
-- 1. First, run the main COMPLETE_MIGRATION_SCRIPT.sql
-- 2. Check the auth.users table to get actual user UUIDs
-- 3. Uncomment and modify the INSERT statements above with real UUIDs
-- 4. Run this script to add test role data
-- ============================================================================