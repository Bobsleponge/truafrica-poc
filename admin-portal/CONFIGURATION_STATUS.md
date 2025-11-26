# 🔍 Admin Portal Configuration Status

## Current Status

### ✅ What's Configured

1. **Code & Dependencies**
   - ✅ All code implemented and ready
   - ✅ All npm packages installed
   - ✅ Next.js 14 App Router configured
   - ✅ Tailwind CSS and shadcn/ui set up

2. **Database (Supabase)**
   - ✅ Supabase project connected: `gcixmuhaybldhfaqnvaa`
   - ✅ `users` table exists with `role` column
   - ✅ `platform_admin` role exists in enum
   - ✅ Admin user exists: `admin@example.com`
   - ⚠️  **Issue:** User role is `admin` instead of `platform_admin`

3. **Admin User**
   - ✅ Email: `admin@example.com`
   - ✅ Password: `dev123456`
   - ⚠️  Role needs to be updated to `platform_admin`

### ❌ What's Missing

1. **Environment Variables** (`.env.local`)
   - ❌ File doesn't exist yet (git-ignored for security)
   - ❌ `SUPABASE_SERVICE_ROLE_KEY` not configured
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` - known
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - known

2. **Server**
   - ❌ Not running (needs `.env.local` first)

## 🔧 Required Actions

### Step 1: Fix Admin User Role

The admin user exists but has role `admin` instead of `platform_admin`. Fix it:

**Option A: Using Supabase SQL Editor (Easiest)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `gcixmuhaybldhfaqnvaa`
3. Go to **SQL Editor**
4. Run:
   ```sql
   UPDATE users SET role = 'platform_admin' WHERE email = 'admin@example.com';
   ```

**Option B: Using Service Role Key**
1. Get service role key (see Step 2)
2. Create `.env.local` with service role key
3. Run: `node scripts/fix-admin-role.js` (will need service role)

### Step 2: Create `.env.local` File

Create `/admin-portal/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gcixmuhaybldhfaqnvaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
NODE_ENV=development
```

**Get Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `gcixmuhaybldhfaqnvaa`
3. Navigate to **Settings** > **API**
4. Scroll to **Project API keys**
5. Copy the **`service_role`** key (secret key, not anon)
6. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in `.env.local`

### Step 3: Start Server

```bash
cd admin-portal
npm run dev
```

### Step 4: Verify Everything Works

Run the verification script:
```bash
cd admin-portal
node scripts/verify-setup.js
```

## ✅ Verification Checklist

- [ ] Admin user role is `platform_admin` (not `admin`)
- [ ] `.env.local` file exists with all 3 variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (not placeholder)
- [ ] Server starts without errors
- [ ] Can access http://localhost:3001/login-button
- [ ] Can login with `admin@example.com` / `dev123456`
- [ ] Redirects to dashboard after login

## 🐛 Troubleshooting

### "Access denied" on login
- Check user role: Run in Supabase SQL Editor:
  ```sql
  SELECT email, role FROM users WHERE email = 'admin@example.com';
  ```
- Should show `role = 'platform_admin'`
- If not, update with SQL from Step 1

### "Missing Supabase environment variables"
- Ensure `.env.local` exists in `/admin-portal` directory
- Check all variables are set (no empty values)
- Restart server after creating/updating `.env.local`

### Server won't start
- Check `.env.local` exists
- Verify port 3001 is not in use: `lsof -ti:3001`
- Check for errors in terminal output

## 📊 Current Configuration Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Code | ✅ Ready | All implemented |
| Dependencies | ✅ Installed | npm packages ready |
| Database Connection | ✅ Working | Anon key works |
| Admin User | ⚠️  Needs Fix | Role is `admin`, needs `platform_admin` |
| Environment File | ❌ Missing | Need to create `.env.local` |
| Service Role Key | ❌ Missing | Need from Supabase Dashboard |
| Server | ❌ Not Running | Needs `.env.local` first |

## 🚀 Quick Start (After Configuration)

Once you've completed the steps above:

1. **Start server:** `cd admin-portal && npm run dev`
2. **Visit:** http://localhost:3001/login-button
3. **Login:** `admin@example.com` / `dev123456`
4. **Done!** You should see the admin dashboard

---

**Last Updated:** Run `node scripts/verify-setup.js` to check current status



