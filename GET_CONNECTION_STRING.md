# Get Your Supabase Connection String

## Your Supabase Project
- **URL**: https://gcixmuhaybldhfaqnvaa.supabase.co
- **Project Ref**: `gcixmuhaybldhfaqnvaa`

## Steps to Get Connection String

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project (gcixmuhaybldhfaqnvaa)

2. **Navigate to Database Settings**
   - Click **"Settings"** in the left sidebar
   - Click **"Database"** in the settings menu

3. **Find Connection String**
   - Scroll down to **"Connection string"** section
   - You'll see multiple tabs: **"URI"**, **"JDBC"**, **"Golang"**, etc.
   - Click on the **"URI"** tab

4. **Copy the Connection String**
   - It will look like:
     ```
     postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres
     ```
   - **Important**: Replace `[YOUR-PASSWORD]` with your actual database password
   - The password is: `Shortcake3782!` (already in your .env.local)

5. **Add to .env.local**
   - Open `.env.local` in your project
   - Add or update this line:
     ```bash
     SUPABASE_DB_CONNECTION_STRING=postgresql://postgres.gcixmuhaybldhfaqnvaa:Shortcake3782!@[HOST_FROM_DASHBOARD]:[PORT]/postgres
     ```
   - Replace `[HOST_FROM_DASHBOARD]` and `[PORT]` with the actual values from the dashboard

## Quick Copy-Paste Format

Once you have the connection string from the dashboard, it should be in this format:

```bash
# Add this to .env.local
SUPABASE_DB_CONNECTION_STRING=postgresql://postgres.gcixmuhaybldhfaqnvaa:Shortcake3782!@[HOST]:[PORT]/postgres
```

## Alternative: Use Connection Pooling Settings

If you see **"Connection pooling"** settings:
- **Transaction mode**: Use port **6543**
- **Session mode**: Use port **5432**
- **Direct connection**: Use port **5432** (different hostname)

The hostname format varies by region. Common formats:
- `aws-0-[PROJECT_REF].pooler.supabase.com` (US regions)
- `[PROJECT_REF].pooler.supabase.com` (some regions)
- `db.[PROJECT_REF].supabase.co` (direct connection)

## After Adding Connection String

1. **Test Connection**
   ```bash
   node scripts/test-db-connection.js
   ```

2. **Run Migrations**
   ```bash
   npm run migrate
   ```

## Current .env.local Status

✅ `NEXT_PUBLIC_SUPABASE_URL` - Already configured  
✅ `SUPABASE_DB_PASSWORD` - Already configured  
❌ `SUPABASE_DB_CONNECTION_STRING` - **Need to add this**

Once you add the connection string from the dashboard, the migrations will work automatically!



