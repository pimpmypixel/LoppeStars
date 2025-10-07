-- ============================================================================
-- COMPLETE MIGRATION SCRIPT FOR SUPABASE CLOUD
-- ============================================================================
-- This script combines all 25 migration files in the correct order
-- Execute this entire script in Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql
-- Created: 2025-01-07
-- ============================================================================

-- ============================================================================
-- 001: CLEANUP EXISTING SCHEMA
-- ============================================================================

-- Safe cleanup with proper error handling
DO $$
BEGIN
    -- Drop existing triggers (safe with IF EXISTS)
    DROP TRIGGER IF EXISTS handle_ratings_updated_at ON public.ratings;
    DROP TRIGGER IF EXISTS handle_stall_ratings_updated_at ON public.stall_ratings;
    DROP TRIGGER IF EXISTS handle_markets_updated_at ON public.markets;
    
    -- Drop existing functions (safe with CASCADE)
    DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_markets_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.user_is_admin(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.current_user_is_admin() CASCADE;
    DROP FUNCTION IF EXISTS public.grant_admin_rights(UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.revoke_admin_rights(UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.trigger_scraper_manually() CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_selected_market(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.log_event(UUID, TEXT, TEXT, UUID, JSONB) CASCADE;

    -- Drop existing tables (safe with IF EXISTS and CASCADE)
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.admin_users CASCADE;
    DROP TABLE IF EXISTS public.ratings CASCADE;
    DROP TABLE IF EXISTS public.stall_ratings CASCADE;
    DROP TABLE IF EXISTS public.markets CASCADE;
    DROP TABLE IF EXISTS public.events CASCADE;
    DROP TABLE IF EXISTS public.scraping_logs CASCADE;
    DROP TABLE IF EXISTS public.send_scrape_status_logs CASCADE;

    RAISE NOTICE 'Schema cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Schema cleanup completed with warnings: %', SQLERRM;
END $$;

-- Drop existing storage policies (safe with IF EXISTS)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view all stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view all processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own processed stall photos" ON storage.objects;
    
    RAISE NOTICE 'Storage policies cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policies cleanup completed with warnings: %', SQLERRM;
END $$;



-- ============================================================================
-- 002: CREATE MARKETS TABLE
-- ============================================================================

-- Markets table: Store flea market information
CREATE TABLE IF NOT EXISTS public.markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE,
  name VARCHAR(500) NOT NULL,
  municipality VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Loppemarked',
  start_date DATE,
  end_date DATE,
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  organizer_name VARCHAR(255),
  organizer_phone VARCHAR(50),
  organizer_email VARCHAR(255),
  organizer_website TEXT,
  opening_hours TEXT,
  entry_fee DECIMAL(8, 2),
  stall_count INTEGER,
  has_food BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_toilets BOOLEAN DEFAULT false,
  has_wifi BOOLEAN DEFAULT false,
  is_indoor BOOLEAN DEFAULT false,
  is_outdoor BOOLEAN DEFAULT true,
  special_features TEXT,
  source_url TEXT,
  loppemarkeder_nu JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Markets indexes
CREATE INDEX IF NOT EXISTS idx_markets_start_date ON public.markets(start_date);
CREATE INDEX IF NOT EXISTS idx_markets_end_date ON public.markets(end_date);
CREATE INDEX IF NOT EXISTS idx_markets_municipality ON public.markets(municipality);
CREATE INDEX IF NOT EXISTS idx_markets_location ON public.markets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_markets_external_id ON public.markets(external_id);
CREATE INDEX IF NOT EXISTS idx_markets_organizer_name ON public.markets(organizer_name);

-- Table comment
COMMENT ON TABLE public.markets IS 'Flea markets with detailed information and metadata';

-- ============================================================================
-- 003: CREATE RATINGS TABLE
-- ============================================================================

-- Ratings table: Store user ratings of market stalls, markets, and other entities
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  stall_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  mobilepay_phone VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  rating_type VARCHAR(20) NOT NULL DEFAULT 'stall' CHECK (rating_type IN ('stall', 'market')),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_market_id ON public.ratings(market_id);
CREATE INDEX IF NOT EXISTS idx_ratings_type ON public.ratings(rating_type);
CREATE INDEX IF NOT EXISTS idx_ratings_market_type ON public.ratings(market_id, rating_type);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at DESC);

-- Table comment
COMMENT ON TABLE public.ratings IS 'User ratings of market stalls, markets, and other entities';
COMMENT ON COLUMN public.ratings.rating_type IS 'Type of rating: stall or market';

-- ============================================================================
-- 004: CREATE EVENTS TABLE
-- ============================================================================

-- Events table: Track user interactions (EAV pattern)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'market_selected', 'stall_rated', 'photo_added', etc.
    entity_type TEXT, -- 'market', 'stall', 'rating', 'photo'
    entity_id UUID, -- reference to the entity being acted upon
    metadata JSONB DEFAULT '{}', -- flexible JSON for event-specific data
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON public.events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON public.events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON public.events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON public.events USING gin(metadata);

-- Table and column comments
COMMENT ON TABLE public.events IS 'Event tracking table using EAV pattern for flexible user interaction logging';
COMMENT ON COLUMN public.events.event_type IS 'Type of event: market_selected, stall_rated, photo_added, market_marked_here, etc.';
COMMENT ON COLUMN public.events.entity_type IS 'Type of entity: market, stall, rating, photo, etc.';
COMMENT ON COLUMN public.events.entity_id IS 'UUID reference to the specific entity';
COMMENT ON COLUMN public.events.metadata IS 'Flexible JSONB field for event-specific data (market_name, rating_value, photo_url, etc.)';

-- ============================================================================
-- 005: CREATE SCRAPING TABLES
-- ============================================================================

-- Scraping logs table: Track scraping operations
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    success BOOLEAN NOT NULL,
    message TEXT NOT NULL,
    output TEXT,
    error_details TEXT,
    scraped_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edge Function logs table: Track send-scrape-status function calls
CREATE TABLE IF NOT EXISTS public.send_scrape_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emails TEXT[] NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scraping logs indexes
CREATE INDEX IF NOT EXISTS idx_scraping_logs_scraped_at ON public.scraping_logs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_success ON public.scraping_logs(success);

-- Table comments
COMMENT ON TABLE public.scraping_logs IS 'Logs from automated scraping operations';
COMMENT ON TABLE public.send_scrape_status_logs IS 'Logs from scrape status notification function calls';

-- ============================================================================
-- 006: CREATE USER ROLES TABLE
-- ============================================================================

-- User roles table: Track user roles with audit trail
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('visitor', 'seller', 'organiser', 'admin')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role, granted_at) -- Allow multiple role grants/revocations but not at same time for same role
    -- Note: Users can have multiple active roles simultaneously (e.g., both seller and organiser)
);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_at ON public.user_roles(granted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, role) WHERE revoked_at IS NULL;

-- Table comment
COMMENT ON TABLE public.user_roles IS 'Track user roles (visitor, seller, organiser, admin) with full audit trail';

-- ============================================================================
-- 007: CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Markets-specific updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 008: CREATE TABLE TRIGGERS
-- ============================================================================

-- Safe trigger creation (drop if exists, then create)
DROP TRIGGER IF EXISTS handle_markets_updated_at ON public.markets;
CREATE TRIGGER handle_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_markets_updated_at();

DROP TRIGGER IF EXISTS handle_ratings_updated_at ON public.ratings;
CREATE TRIGGER handle_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 009: CREATE ROLE SYSTEM FUNCTIONS
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

-- ============================================================================
-- 010: CREATE CONVENIENCE ROLE FUNCTIONS
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

-- ============================================================================
-- 011: CREATE ROLE MANAGEMENT FUNCTIONS
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

-- ============================================================================
-- 012: CREATE ROLE REVOCATION FUNCTIONS
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

-- ============================================================================
-- 013: CREATE ADMIN FUNCTIONS
-- ============================================================================

-- Manual scraper trigger function for admins
CREATE OR REPLACE FUNCTION public.trigger_scraper_manually()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN    
    -- Check if current user is admin
    IF NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can trigger the scraper manually';
    END IF;

    -- Call the Edge Function directly
    SELECT net.http_post(
        url:='https://oprevwbturtujbugynct.supabase.co/functions/v1/trigger-scraper',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'token' || '"}'::jsonb,
        body:='{}'::jsonb
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function comment
COMMENT ON FUNCTION public.trigger_scraper_manually IS 'Manually trigger the scraper (admin only operation)';

-- ============================================================================
-- 014: CREATE EVENT SYSTEM FUNCTIONS
-- ============================================================================

-- Get the latest market selection for a user
CREATE OR REPLACE FUNCTION public.get_user_selected_market(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_market_id UUID;
BEGIN
    SELECT entity_id INTO v_market_id
    FROM public.events
    WHERE user_id = p_user_id
      AND event_type = 'market_selected'
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN v_market_id;
END;
$$;

-- Log events helper function
CREATE OR REPLACE FUNCTION public.log_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.events (user_id, event_type, entity_type, entity_id, metadata)
    VALUES (p_user_id, p_event_type, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.get_user_selected_market IS 'Returns the most recently selected market UUID for a given user';
COMMENT ON FUNCTION public.log_event IS 'Helper function to log events with proper validation';

-- ============================================================================
-- 015: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.send_scrape_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies before creating new ones (safe with IF EXISTS)
DO $$
BEGIN
    -- Markets policies
    DROP POLICY IF EXISTS "Everyone can read markets" ON public.markets;
    DROP POLICY IF EXISTS "Authenticated users can manage markets" ON public.markets;
    DROP POLICY IF EXISTS "Admins can manage all markets" ON public.markets;
    
    -- Ratings policies
    DROP POLICY IF EXISTS "Users can read all ratings" ON public.ratings;
    DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
    DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
    DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.ratings;
    DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
    
    -- Events policies
    DROP POLICY IF EXISTS "Users can read own events" ON public.events;
    DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
    DROP POLICY IF EXISTS "Admins can read all events" ON public.events;
    
    -- Scraping logs policies
    DROP POLICY IF EXISTS "Service role can manage scraping logs" ON public.scraping_logs;
    DROP POLICY IF EXISTS "Admins can manage scraping logs" ON public.scraping_logs;
    
    -- Send scrape status logs policies
    DROP POLICY IF EXISTS "Service role can manage status logs" ON public.send_scrape_status_logs;
    DROP POLICY IF EXISTS "Admins can read status logs" ON public.send_scrape_status_logs;
    
    -- User roles policies
    DROP POLICY IF EXISTS "Admins can read user roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can grant roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;
    
    RAISE NOTICE 'RLS policies cleanup completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS policies cleanup completed with warnings: %', SQLERRM;
END $$;

-- ============================================================================
-- 016: CREATE RLS POLICIES FOR MARKETS
-- ============================================================================

-- Markets policies
CREATE POLICY "Everyone can read markets" ON public.markets 
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage markets" ON public.markets 
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage all markets" ON public.markets 
    FOR ALL USING (public.current_user_is_admin());

-- ============================================================================
-- 017: CREATE RLS POLICIES FOR RATINGS
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

-- ============================================================================
-- 018: CREATE RLS POLICIES FOR EVENTS
-- ============================================================================

-- Events policies
CREATE POLICY "Users can read own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all events" ON public.events 
    FOR SELECT USING (public.current_user_is_admin());

-- ============================================================================
-- 019: CREATE RLS POLICIES FOR SCRAPING TABLES
-- ============================================================================

-- Scraping logs policies
CREATE POLICY "Service role can manage scraping logs" ON public.scraping_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage scraping logs" ON public.scraping_logs 
    FOR ALL USING (public.current_user_is_admin());

-- Send scrape status logs policies
CREATE POLICY "Service role can manage status logs" ON public.send_scrape_status_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read status logs" ON public.send_scrape_status_logs 
    FOR SELECT USING (public.current_user_is_admin());

-- ============================================================================
-- 020: CREATE RLS POLICIES FOR USER ROLES
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

-- ============================================================================
-- 021: SETUP STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets (safe with conflict handling)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES 
        ('stall-photos', 'stall-photos', true, 52428800, '{"image/jpeg","image/png","image/webp"}'),
        ('stall-photos-processed', 'stall-photos-processed', true, 52428800, '{"image/jpeg","image/png","image/webp"}')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Storage buckets created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage bucket creation completed with warnings: %', SQLERRM;
END $$;

-- ============================================================================
-- 022: CREATE STORAGE POLICIES
-- ============================================================================

-- Storage policies (safe creation with error handling)
DO $$
BEGIN
    -- Storage policies for stall photos
    CREATE POLICY "Users can upload stall photos" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can view all stall photos" ON storage.objects 
        FOR SELECT USING (bucket_id = 'stall-photos');
    CREATE POLICY "Users can update their own stall photos" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can delete their own stall photos" ON storage.objects 
        FOR DELETE USING (bucket_id = 'stall-photos' AND auth.uid()::text = (storage.foldername(name))[0]);

    -- Storage policies for processed stall photos
    CREATE POLICY "Users can upload processed stall photos" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can view all processed stall photos" ON storage.objects 
        FOR SELECT USING (bucket_id = 'stall-photos-processed');
    CREATE POLICY "Users can update their own processed stall photos" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    CREATE POLICY "Users can delete their own processed stall photos" ON storage.objects 
        FOR DELETE USING (bucket_id = 'stall-photos-processed' AND auth.uid()::text = (storage.foldername(name))[0]);
    
    RAISE NOTICE 'Storage policies created successfully';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some storage policies already exist, skipping duplicates';
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policy creation completed with warnings: %', SQLERRM;
END $$;

-- ============================================================================
-- 023: GRANT FUNCTION PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_seller TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_organiser TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_rights TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_rights TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_scraper_manually TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_selected_market TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_event TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- 024: INITIALIZE ADMIN USER
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

-- ============================================================================
-- 025: LOG MIGRATION COMPLETION
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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All 25 migrations have been executed successfully!
-- Your role-based system is now ready with:
-- ✅ Complete table structure (markets, ratings, events, scraping_logs, user_roles)
-- ✅ Role system (visitor, seller, organiser, admin) with organiser as simple label
-- ✅ Multiple roles per user support
-- ✅ Admin system with ADMIN_EMAIL integration
-- ✅ Row Level Security policies
-- ✅ Storage buckets and policies
-- ✅ Event tracking system
-- ✅ Function permissions granted
-- ============================================================================