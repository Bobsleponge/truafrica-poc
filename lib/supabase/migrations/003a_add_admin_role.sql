-- Migration 003a: Add 'admin' role to user_role enum
-- This must be in a separate migration because enum values must be committed before use

-- Extend user_role enum to include 'admin'
-- Using DO block to safely add if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'admin' value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
END $$;




