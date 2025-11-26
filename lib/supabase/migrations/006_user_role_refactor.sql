-- Migration 006: User Role Refactor
-- Updates user_role enum to include new roles: platform_admin, client_owner, client_user, team_account
-- Adds sub_role column to users table for client_user sub-roles

-- Add new enum values to user_role
-- Note: We cannot remove enum values, so we'll add new ones and migrate data in a later migration
DO $$ 
BEGIN
    -- Add platform_admin if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'platform_admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'platform_admin';
    END IF;

    -- Add client_owner if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'client_owner' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'client_owner';
    END IF;

    -- Add client_user if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'client_user' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'client_user';
    END IF;

    -- Add team_account if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'team_account' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'team_account';
    END IF;
END $$;

-- Add sub_role column to users table
-- Used for client_user sub-roles: 'Manager', 'Analyst', 'Viewer'
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sub_role TEXT;

-- Add index for sub_role queries
CREATE INDEX IF NOT EXISTS idx_users_sub_role ON public.users(sub_role) WHERE sub_role IS NOT NULL;



