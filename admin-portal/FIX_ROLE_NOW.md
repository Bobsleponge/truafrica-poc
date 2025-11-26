# ⚡ Quick Fix - Run This SQL Now

The enum needs to be updated first. Run this in Supabase SQL Editor:

**Step 1: Add enum value**
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

**Step 2: Update user role**
```sql
UPDATE users SET role = 'platform_admin' WHERE email = 'admin@example.com';
```

**Quick Link:** https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/sql/new

After running these, the admin portal will work!
