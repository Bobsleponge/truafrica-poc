# ✅ Complete Setup Instructions

## Current Status

✅ **Code:** Complete and ready  
✅ **Dependencies:** Installed  
✅ **Database:** Connected  
✅ **Admin User:** Exists (admin@example.com)  
✅ **.env.local:** Created  
⚠️  **Service Role Key:** Needs to be added  
⚠️  **Admin Role:** Needs to be updated to `platform_admin`

## Step-by-Step Completion

### Step 1: Get Service Role Key (2 minutes)

1. Go to: https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/settings/api
2. Scroll to **Project API keys**
3. Find **`service_role`** key (secret key)
4. Click the eye icon to reveal it
5. Click **Copy**

### Step 2: Add Service Role Key to .env.local

Open `/admin-portal/.env.local` and replace:
```
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

With:
```
SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
```

Save the file.

### Step 3: Fix Admin User Role

**Option A: Using SQL Editor (Recommended - 1 minute)**

1. Go to: https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/sql/new
2. Paste this SQL:
   ```sql
   UPDATE users SET role = 'platform_admin' WHERE email = 'admin@example.com';
   ```
3. Click **Run**
4. You should see "Success. No rows returned"

**Option B: Using Script (After adding service role key)**

```bash
cd admin-portal
node scripts/final-setup.js
```

### Step 4: Verify Setup

```bash
cd admin-portal
node scripts/verify-setup.js
```

You should see all green checkmarks ✅

### Step 5: Start the Server

```bash
cd admin-portal
npm run dev
```

Wait for: `✓ Ready on http://localhost:3001`

### Step 6: Login

1. Open: http://localhost:3001/login-button
2. Click **"Login to Admin Portal"** button
3. Or use quick access: http://localhost:3001/login/quick-access
4. Credentials:
   - Email: `admin@example.com`
   - Password: `dev123456`

## Quick Commands Summary

```bash
# 1. Add service role key to .env.local (manual)
# 2. Fix admin role in Supabase SQL Editor (manual)
# 3. Verify
cd admin-portal && node scripts/verify-setup.js

# 4. Start server
cd admin-portal && npm run dev

# 5. Open browser
open http://localhost:3001/login-button
```

## Troubleshooting

### "Access denied" on login
- Verify role is `platform_admin`: Run in SQL Editor:
  ```sql
  SELECT email, role FROM users WHERE email = 'admin@example.com';
  ```

### "Missing Supabase environment variables"
- Check `.env.local` exists and has all 3 variables
- Restart server after editing `.env.local`

### Server won't start
- Check port 3001 is free: `lsof -ti:3001`
- Check for errors in terminal

## ✅ Completion Checklist

- [ ] Service role key added to `.env.local`
- [ ] Admin role updated to `platform_admin` in database
- [ ] Server starts without errors
- [ ] Can access http://localhost:3001/login-button
- [ ] Can login with admin@example.com / dev123456
- [ ] Redirects to dashboard after login

Once all checked, you're ready to use the admin portal! 🎉



