-- Migration 007: Team Accounts Table
-- Creates team_accounts table for TruAfrica internal staff

-- Create team_accounts table
-- Note: client_id foreign key will be added in migration 008 after clients table is created
CREATE TABLE IF NOT EXISTS public.team_accounts (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID, -- Optional assignment to specific client (FK added in migration 008)
  department TEXT,
  permissions JSONB DEFAULT '{}', -- Flexible permissions structure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_accounts_client_id ON public.team_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_team_accounts_department ON public.team_accounts(department);

-- Add trigger for updated_at
CREATE TRIGGER update_team_accounts_updated_at BEFORE UPDATE ON public.team_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.team_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_accounts
-- Team accounts can view their own record
CREATE POLICY "Team accounts can view their own record"
  ON public.team_accounts FOR SELECT
  USING (id = auth.uid());

-- Team accounts can update their own record (limited fields)
CREATE POLICY "Team accounts can update their own record"
  ON public.team_accounts FOR UPDATE
  USING (id = auth.uid());

-- Note: Full access policies for team accounts will be added in migration 010

