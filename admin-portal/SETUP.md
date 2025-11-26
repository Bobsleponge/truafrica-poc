# Admin Portal Setup Guide

## Step 1: Environment Variables

Create a `.env.local` file in `/admin-portal` with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gcixmuhaybldhfaqnvaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
NODE_ENV=development
```

**To get your Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the `service_role` key (keep it secret!)
5. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in `.env.local`

## Step 2: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd admin-portal
npm install
```

## Step 3: Create Platform Admin User

You have two options:

### Option A: Use Existing Script (if you have service role key)

```bash
cd admin-portal
node scripts/create-platform-admin.js admin@truafrica.com SecurePass123 "Admin User"
```

### Option B: Use Main App Script

The main app already has a script that creates an admin user:

```bash
cd /Users/Matty/truafrica-poc
node scripts/create-dev-users.js
```

This creates `admin@example.com` with password `dev123456` and role `platform_admin`.

## Step 4: Start Development Server

```bash
cd admin-portal
npm run dev
```

The admin portal will run on **http://localhost:3001**

## Step 5: Login

1. Navigate to http://localhost:3001/login
2. Use your platform admin credentials:
   - Email: `admin@example.com` (if using dev script)
   - Password: `dev123456`
3. You'll be redirected to the dashboard

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists in `/admin-portal` directory
- Check that all three environment variables are set

### "Access denied" on login
- Verify user has `platform_admin` role in database
- Check `users.role` column in Supabase
- You can verify with: `SELECT id, email, role FROM users WHERE email = 'admin@example.com';`

### "Service role key not found"
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Get it from Supabase Dashboard > Settings > API

### Port 3001 already in use
- Change port in `package.json`: `"dev": "next dev -p 3002"`
- Or stop the process using port 3001



