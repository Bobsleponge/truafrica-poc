-- Migration 008: Clients Table
-- Creates clients table to represent client organizations
-- Adds client_id column to users table

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  contact_email TEXT,
  billing_info JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add client_id column to users table
-- This links users to their client organization
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON public.clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);

-- Add trigger for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to team_accounts.client_id (created in migration 007)
ALTER TABLE public.team_accounts
  ADD CONSTRAINT team_accounts_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
-- Users can view clients they belong to
CREATE POLICY "Users can view their own client"
  ON public.clients FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    )
  );

-- Client owners can view their client
CREATE POLICY "Client owners can view their client"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'client_owner'
      AND users.client_id = clients.id
    )
  );

-- Client users can view their client
CREATE POLICY "Client users can view their client"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'client_user'
      AND users.client_id = clients.id
    )
  );

-- Team accounts can view all clients
CREATE POLICY "Team accounts can view all clients"
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'team_account'
    )
  );

-- Note: Platform admins use service-role, so no RLS policy needed
-- Client owners can update their own client (will be added in migration 010)

