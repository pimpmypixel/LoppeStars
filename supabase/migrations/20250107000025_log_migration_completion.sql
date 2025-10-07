-- ============================================================================
-- LOG MIGRATION COMPLETION
-- ============================================================================
-- Log the completion of the migration system in events table
-- Created: 2025-01-07
-- ============================================================================

-- Log completion (safe JSON formatting)
DO $$
DECLARE
    admin_user_exists BOOLEAN;
BEGIN
    -- Check if admin user exists before logging
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'pimpmypixelcph@gmail.com'
    ) INTO admin_user_exists;
    
    IF admin_user_exists THEN
        INSERT INTO public.events (
            user_id, 
            event_type, 
            entity_type, 
            metadata
        ) 
        SELECT 
            id,
            'system_migration',
            'database',
            jsonb_build_object(
                'migration', 'consolidated_role_based_system',
                'timestamp', NOW()::text,
                'version', '2025-01-07'
            )
        FROM auth.users 
        WHERE email = 'pimpmypixelcph@gmail.com'
        LIMIT 1;
        
        RAISE NOTICE 'Migration completion logged for admin user';
    ELSE
        RAISE NOTICE 'Admin user not found, skipping migration log';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Migration logging completed with warnings: %', SQLERRM;
END $$;

-- Success message
SELECT 'Role-based database system migration completed successfully!' as result;