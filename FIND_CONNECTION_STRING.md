# How to Find Your Supabase Database Connection String

## Method 1: Settings > Database (Most Common)

1. **Go to your Supabase project**
   - https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa
   - Or: https://supabase.com/dashboard → Click on your project

2. **Click "Settings" in the left sidebar**
   - It's usually near the bottom of the sidebar
   - Icon looks like a gear/cog ⚙️

3. **Click "Database" in the settings menu**
   - Should be in the list of settings options
   - Look for "Database" or "Connection string"

4. **Find "Connection string" section**
   - Scroll down on the Database settings page
   - Look for a section titled "Connection string" or "Connection pooling"
   - You'll see tabs: "URI", "JDBC", "Golang", etc.

5. **Click the "URI" tab**
   - Copy the connection string shown

## Method 2: Project Settings > API

1. **Go to Settings > API**
2. **Look for "Database" section**
3. **Find connection string there**

## Method 3: SQL Editor (Alternative)

1. **Click "SQL Editor" in left sidebar**
2. **Click "New query"**
3. **Look for connection info in the editor or settings**

## Method 4: Direct Link

Try going directly to:
- https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/settings/database

## What the Connection String Looks Like

It should be in one of these formats:

**Format 1 (Pooler - Transaction mode):**
```
postgresql://postgres.gcixmuhaybldhfaqnvaa:[PASSWORD]@aws-0-gcixmuhaybldhfaqnvaa.pooler.supabase.com:6543/postgres
```

**Format 2 (Pooler - Session mode):**
```
postgresql://postgres.gcixmuhaybldhfaqnvaa:[PASSWORD]@aws-0-gcixmuhaybldhfaqnvaa.pooler.supabase.com:5432/postgres
```

**Format 3 (Direct connection):**
```
postgresql://postgres:[PASSWORD]@db.gcixmuhaybldhfaqnvaa.supabase.co:5432/postgres
```

## If You Still Can't Find It

### Option A: Use Just the Password (We'll construct it)

Your `.env.local` already has:
```bash
SUPABASE_DB_PASSWORD=Shortcake3782!
```

The migration script will try to construct the connection string automatically. However, if it fails, we need the exact hostname.

### Option B: Check Your Supabase Region

The connection string format depends on your Supabase project's region. 

1. Go to: Settings > General
2. Look for "Region" or "Project region"
3. Common regions: US East, EU West, AP Southeast

### Option C: Contact Supabase Support

If you can't find it, you can:
1. Check Supabase documentation
2. Contact Supabase support
3. Or we can try to run migrations manually via SQL Editor

## Quick Alternative: Manual Migration

If finding the connection string is difficult, you can run the migration manually:

1. **Go to SQL Editor** in Supabase Dashboard
2. **Click "New query"**
3. **Open**: `lib/supabase/migrations/004_campaign_builder_extensions.sql`
4. **Copy the entire file**
5. **Paste into SQL Editor**
6. **Click "Run"**

This works just as well and doesn't require the connection string!



