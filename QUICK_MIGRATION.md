# Quick Migration Guide - No Connection String Needed!

Since finding the connection string can be tricky, here's the **easiest way** to run the migration:

## Run Migration in Supabase Dashboard (2 minutes)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa
2. Click **"SQL Editor"** in the left sidebar (it has a database icon)
3. Click **"New query"** button (top right)

### Step 2: Copy Migration SQL
1. Open this file in your editor:
   ```
   lib/supabase/migrations/004_campaign_builder_extensions.sql
   ```
2. Select all (Cmd/Ctrl + A)
3. Copy (Cmd/Ctrl + C)

### Step 3: Paste and Run
1. Paste into the SQL Editor
2. Click **"Run"** button (or press Cmd/Ctrl + Enter)
3. Wait for "Success" message

### Step 4: Verify
1. Click **"Table Editor"** in left sidebar
2. Look for new tables:
   - `campaign_versions`
   - `campaign_collaborators`
   - `campaign_approvals`
   - `question_templates`
   - `reward_configurations`
   - `campaign_quality_rules`
   - `in_house_campaigns`

## That's It! ✅

No connection string needed. The migration runs directly in Supabase.

## Next Steps

After migration:
1. **Seed question templates** (optional):
   ```bash
   npm run seed:templates
   ```

2. **Test the campaign builder**:
   - Navigate to: `/company/campaigns/builder`
   - Create a test campaign



