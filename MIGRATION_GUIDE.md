# Migration 004 - Campaign Builder Extensions

## Quick Migration Guide

Since direct database connection requires specific credentials, here are the recommended ways to run Migration 004:

## Method 1: Supabase Dashboard (Recommended - Easiest)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration SQL**
   - Open the file: `lib/supabase/migrations/004_campaign_builder_extensions.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for success message

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check that new tables exist in Table Editor

## Method 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Method 3: Direct Database Connection

If you have the database password:

1. **Get Connection String**
   - Supabase Dashboard > Settings > Database
   - Copy the connection string (URI format)

2. **Add to .env.local**
   ```bash
   SUPABASE_DB_PASSWORD=your_database_password
   ```

3. **Run Migration Script**
   ```bash
   npm run migrate
   ```

## What Migration 004 Does

This migration adds:

- **New Enum Types**: campaign_mode, approval_status, collaborator_role, in_house_campaign_type, data_sensitivity_level, reward_distribution_method, currency_type
- **Extended question_type enum**: Adds 7 new question types
- **Extended campaigns table**: Adds 20+ new columns for campaign builder
- **Extended questions table**: Adds fields for branching, validation, rewards, etc.
- **New Tables**:
  - `campaign_versions` - Version control
  - `campaign_collaborators` - Real-time collaboration
  - `campaign_approvals` - Approval workflow
  - `question_templates` - Question bank
  - `reward_configurations` - Reward settings
  - `campaign_quality_rules` - Quality control
  - `in_house_campaigns` - Platform growth campaigns
- **Indexes**: Performance indexes on all new tables
- **RLS Policies**: Row-level security for all new tables
- **Triggers**: Auto-update timestamps

## Verification

After running the migration, verify it worked:

1. **Check Tables Exist**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'campaign_versions',
     'campaign_collaborators',
     'campaign_approvals',
     'question_templates',
     'reward_configurations',
     'campaign_quality_rules',
     'in_house_campaigns'
   );
   ```

2. **Check New Columns**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'campaigns' 
   AND column_name IN (
     'company_name',
     'wizard_data',
     'wizard_step',
     'approval_status'
   );
   ```

## Troubleshooting

### Error: "type already exists"
- This is OK if re-running the migration
- The migration uses `IF NOT EXISTS` clauses

### Error: "column already exists"
- Some columns may already exist
- The migration uses `ADD COLUMN IF NOT EXISTS`

### Error: "permission denied"
- Ensure you're using the service_role key or have proper database permissions
- Check RLS policies are enabled

### Connection Issues
- Verify your Supabase URL and keys are correct
- Check network connectivity
- Try using the Supabase Dashboard method instead

## Next Steps

After migration:

1. **Seed Question Templates** (Optional)
   ```bash
   npm run seed:templates
   ```

2. **Test the Campaign Builder**
   - Navigate to `/company/campaigns/builder`
   - Create a test campaign
   - Verify all 20 steps work

3. **Verify Features**
   - Version control
   - Collaboration
   - Approval workflow
   - Export functionality



