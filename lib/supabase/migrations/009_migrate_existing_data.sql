-- Migration 009: Migrate Existing Data
-- Converts existing company role to client_owner
-- Converts existing admin role to platform_admin
-- Creates client records for existing company users
-- Renames company_id to client_id in questions table
-- Renames company_dashboard_stats to client_dashboard_stats

-- Step 1: Create client records for existing company users
-- Each company user becomes a client_owner with their own client record
INSERT INTO public.clients (id, name, contact_email, status, created_at)
SELECT 
  uuid_generate_v4(),
  COALESCE(users.name, users.email, 'Client ' || users.id::text),
  users.email,
  'active',
  users.created_at
FROM public.users
WHERE users.role = 'company'
ON CONFLICT DO NOTHING;

-- Step 2: Update users table
-- Link company users to their new client records and convert role to client_owner
UPDATE public.users
SET 
  client_id = (
    SELECT clients.id 
    FROM public.clients 
    WHERE clients.contact_email = users.email 
    LIMIT 1
  ),
  role = 'client_owner'
WHERE users.role = 'company';

-- Step 3: Convert admin role to platform_admin
UPDATE public.users
SET role = 'platform_admin'
WHERE users.role = 'admin';

-- Step 4: Rename company_id to client_id in questions table
-- First, drop the old foreign key constraint
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_company_id_fkey;

-- Drop the old index
DROP INDEX IF EXISTS idx_questions_company_id;

-- Rename the column
ALTER TABLE public.questions
  RENAME COLUMN company_id TO client_id;

-- Recreate the foreign key constraint
ALTER TABLE public.questions
  ADD CONSTRAINT questions_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Recreate the index
CREATE INDEX idx_questions_client_id ON public.questions(client_id);

-- Step 5: Rename company_dashboard_stats table to client_dashboard_stats
ALTER TABLE public.company_dashboard_stats
  RENAME TO client_dashboard_stats;

-- Step 6: Rename company_id to client_id in client_dashboard_stats
ALTER TABLE public.client_dashboard_stats
  DROP CONSTRAINT IF EXISTS company_dashboard_stats_company_id_fkey;

DROP INDEX IF EXISTS idx_company_dashboard_stats_company_id;

ALTER TABLE public.client_dashboard_stats
  RENAME COLUMN company_id TO client_id;

-- Recreate foreign key and index
ALTER TABLE public.client_dashboard_stats
  ADD CONSTRAINT client_dashboard_stats_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX idx_client_dashboard_stats_client_id ON public.client_dashboard_stats(client_id);

-- Step 7: Update trigger name
DROP TRIGGER IF EXISTS update_company_dashboard_stats_updated_at ON public.client_dashboard_stats;
CREATE TRIGGER update_client_dashboard_stats_updated_at BEFORE UPDATE ON public.client_dashboard_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



