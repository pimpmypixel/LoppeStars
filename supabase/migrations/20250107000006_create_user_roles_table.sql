-- ============================================================================
-- CREATE USER ROLES TABLE
-- ============================================================================
-- Track user roles (visitor, seller, organiser, admin) with full audit trail
-- Created: 2025-01-07
-- ============================================================================

-- User roles table: Track user roles with audit trail
CREATE TABLE public.user_roles (
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
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX idx_user_roles_granted_at ON public.user_roles(granted_at DESC);
CREATE INDEX idx_user_roles_active ON public.user_roles(user_id, role) WHERE revoked_at IS NULL;

-- Table comment
COMMENT ON TABLE public.user_roles IS 'Track user roles (visitor, seller, organiser, admin) with full audit trail';