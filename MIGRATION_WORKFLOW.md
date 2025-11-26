# Migration Workflow - Automated System

## Current Setup ✅

- **Supabase URL**: Configured in `.env.local`
- **Database Password**: Configured in `.env.local`
- **Migration Scripts**: Ready to use

## For Future Migrations

### Option 1: Automated (If Connection String Works)

1. **Run Migration**
   ```bash
   npm run migrate
   ```

2. **Verify**
   - Check Supabase Dashboard > Table Editor
   - Verify new tables/columns exist

### Option 2: Manual (If Connection String Not Working)

1. **Create Migration File**
   - Add new SQL file to: `lib/supabase/migrations/005_[name].sql`
   - Follow naming convention: `00X_description.sql`

2. **Run in Supabase Dashboard**
   - Go to: SQL Editor > New query
   - Copy migration SQL
   - Paste and run

3. **Verify**
   - Check Table Editor for changes

## Migration File Naming

- `001_initial_schema.sql`
- `002_[description].sql`
- `003_[description].sql`
- `004_campaign_builder_extensions.sql` ✅ (completed)
- `005_[next_feature].sql` (next)

## Creating New Migrations

### Template

```sql
-- Migration 00X: [Description]
-- [What this migration does]

-- Example: Add new table
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_name ON public.new_table(name);

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
DROP POLICY IF EXISTS "policy_name" ON public.new_table;
CREATE POLICY "policy_name"
  ON public.new_table FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Best Practices

1. **Use IF NOT EXISTS** for tables, indexes
2. **Use DO blocks** for enum values
3. **DROP IF EXISTS** before CREATE for policies, triggers
4. **Add comments** explaining what each section does
5. **Test in SQL Editor** before committing

## Available Commands

```bash
# Run all migrations
npm run migrate

# Show migration SQL (for manual execution)
npm run migrations:show

# Test database connection
npm run db:test

# Auto-detect connection string
npm run db:auto-setup

# Setup database connection interactively
npm run setup:db
```

## Troubleshooting

### Connection Issues
- Run: `npm run db:test` to diagnose
- Try: `npm run db:auto-setup` to auto-detect
- Fallback: Use manual SQL Editor method

### Migration Fails
- Check SQL syntax in Supabase SQL Editor first
- Verify dependencies (tables, enums exist)
- Check RLS policies don't conflict

### Need Help?
- Check migration file for syntax errors
- Test SQL in Supabase SQL Editor first
- Verify all dependencies exist

## Next Migration

When creating the next migration:

1. Create file: `lib/supabase/migrations/005_[name].sql`
2. Write migration SQL
3. Test in SQL Editor
4. Run: `npm run migrate` (or manual)
5. Verify changes
6. Commit to git



