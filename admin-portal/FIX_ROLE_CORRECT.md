# ✅ Correct SQL - Run These Separately

The enum value must be committed before use. Run these **one at a time**:

## Step 1: Add enum value (Run this first, wait for success)

```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'platform_admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'platform_admin';
    END IF;
END $$;
```

**Click "Run" and wait for success message.**

## Step 2: Update user role (Run this AFTER Step 1 completes)

```sql
UPDATE users SET role = 'platform_admin' WHERE email = 'admin@example.com';
```

**Click "Run" again.**

## Quick Link
https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/sql/new

After both complete successfully, the admin portal will work!
