# Run Migration 004 - Quick Guide

## ✅ Migration File Ready

The migration file has been prepared and is ready to execute:
- **Location**: `lib/supabase/migrations/004_campaign_builder_extensions.sql`
- **Status**: ✅ Ready (idempotent - safe to run multiple times)

## 🚀 How to Run (Choose One Method)

### Method 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

3. **Copy Migration SQL**
   - Open: `lib/supabase/migrations/004_campaign_builder_extensions.sql`
   - Select all (Cmd/Ctrl + A)
   - Copy (Cmd/Ctrl + C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)

5. **Verify Success**
   - Should see: "Success. No rows returned"
   - Check Table Editor to see new tables

### Method 2: View Migration SQL in Terminal

```bash
npm run migrations:show
```

This will display all migrations including 004. Copy the SQL for Migration 004.

### Method 3: Quick Preview Script

```bash
node scripts/prepare-migration-004.js
```

This shows the migration SQL with instructions.

## 📋 What Gets Created

### New Tables (7)
- `campaign_versions` - Version control
- `campaign_collaborators` - Real-time collaboration  
- `campaign_approvals` - Approval workflow
- `question_templates` - Question bank
- `reward_configurations` - Reward settings
- `campaign_quality_rules` - Quality control
- `in_house_campaigns` - Platform growth campaigns

### Extended Tables
- `campaigns` - 20+ new columns
- `questions` - 8 new columns

### New Enums (7)
- `campaign_mode`
- `approval_status`
- `collaborator_role`
- `in_house_campaign_type`
- `data_sensitivity_level`
- `reward_distribution_method`
- `currency_type`

### Extended Enum
- `question_type` - Adds 7 new question types

## ✅ Verification

After running, verify with this SQL in Supabase SQL Editor:

```sql
-- Check tables exist
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
)
ORDER BY table_name;
```

Should return 7 rows.

## 🎯 Next Steps After Migration

1. **Seed Question Templates** (Optional)
   ```bash
   npm run seed:templates
   ```

2. **Test Campaign Builder**
   - Navigate to: `/company/campaigns/builder`
   - Create a test campaign
   - Go through all 20 steps

3. **Verify Features Work**
   - Version control
   - Collaboration
   - Approval workflow
   - Export functionality

## ⚠️ Troubleshooting

**Error: "type already exists"**
- ✅ Safe to ignore - means enum values already exist

**Error: "relation already exists"**  
- ✅ Safe to ignore - means tables already exist (migration was partially run)

**Error: "permission denied"**
- Check you're using the correct Supabase project
- Verify you have admin/database access

**Migration runs but features don't work**
- Clear browser cache
- Restart Next.js dev server: `npm run dev`
- Check browser console for errors

---

**Ready to run!** Just copy the SQL from the migration file and paste into Supabase SQL Editor.



