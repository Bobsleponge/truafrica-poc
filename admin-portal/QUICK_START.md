# Quick Start Guide

## ✅ Completed Steps

1. ✅ **Dependencies Installed** - All npm packages are installed
2. ✅ **Admin User Created** - Platform admin user exists:
   - Email: `admin@example.com`
   - Password: `dev123456`
   - Role: `platform_admin`

## 🔧 Required: Set Up Environment Variables

**IMPORTANT:** You need to create `.env.local` file manually (it's git-ignored for security).

Create `/admin-portal/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gcixmuhaybldhfaqnvaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
NODE_ENV=development
```

### How to Get Service Role Key:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `gcixmuhaybldhfaqnvaa`
3. Navigate to **Settings** > **API**
4. Scroll down to **Project API keys**
5. Copy the **`service_role`** key (the secret one, not the anon key)
6. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in `.env.local`

**⚠️ Security Note:** The service role key bypasses Row Level Security. Keep it secret and never commit it to git.

## 🚀 Start the Server

The dev server should already be starting. If not:

```bash
cd admin-portal
npm run dev
```

The admin portal will be available at: **http://localhost:3001**

## 🔐 Login

1. Navigate to: http://localhost:3001/login
2. Use credentials:
   - **Email:** `admin@example.com`
   - **Password:** `dev123456`
3. You'll be redirected to the dashboard

## 📋 What's Available

- **Dashboard** (`/dashboard`) - KPI cards and analytics charts
- **Clients** (`/clients`) - Manage all client organizations
- **Campaigns** (`/campaigns`) - View and manage campaigns
- **Users** (`/users`) - Manage users and roles
- **Analytics** (`/analytics`) - Platform-wide analytics
- **Settings** (`/settings`) - Global platform configuration

## 🐛 Troubleshooting

### Server won't start
- Check that `.env.local` exists with all required variables
- Ensure port 3001 is not in use: `lsof -ti:3001`

### "Access denied" on login
- Verify user exists: Check Supabase dashboard > Authentication > Users
- Verify role: Run in Supabase SQL editor:
  ```sql
  SELECT id, email, role FROM users WHERE email = 'admin@example.com';
  ```
- Should show `role = 'platform_admin'`

### "Missing Supabase environment variables"
- Ensure `.env.local` file exists in `/admin-portal` directory
- Check all three variables are set (no empty values)

## 📚 More Information

See `SETUP.md` for detailed setup instructions.
See `README.md` for full documentation.



