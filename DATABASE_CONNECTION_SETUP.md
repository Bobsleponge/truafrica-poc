# Database Connection Setup Guide

## Quick Setup

### Option 1: Use Connection String (Recommended)

1. **Get Connection String from Supabase**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **Settings > Database**
   - Scroll to **"Connection string"** section
   - Select **"URI"** tab
   - Copy the connection string (starts with `postgresql://`)

2. **Add to .env.local**
   ```bash
   SUPABASE_DB_CONNECTION_STRING=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[PROJECT_REF].pooler.supabase.com:6543/postgres
   ```

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

### Option 2: Use Database Password

1. **Get Database Password**
   - Go to: Supabase Dashboard > Settings > Database
   - Find your database password (or reset it if needed)

2. **Add to .env.local**
   ```bash
   SUPABASE_DB_PASSWORD=your_database_password_here
   ```

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

## Interactive Setup

Run the interactive setup script:

```bash
npm run setup:db
```

This will guide you through the setup process.

## Test Connection

Before running migrations, test your connection:

```bash
node scripts/test-db-connection.js
```

## Connection String Formats

Supabase supports multiple connection formats. The migration script will try these automatically:

1. **Pooler Transaction Mode** (port 6543) - Recommended
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[PROJECT_REF].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **Pooler Session Mode** (port 5432)
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[PROJECT_REF].pooler.supabase.com:5432/postgres?pgbouncer=true
   ```

3. **Direct Connection** (port 5432)
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

## Example .env.local

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Connection for Migrations (choose one)
# Option 1: Full connection string (recommended)
SUPABASE_DB_CONNECTION_STRING=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[PROJECT_REF].pooler.supabase.com:6543/postgres

# Option 2: Just the password (script will construct connection string)
# SUPABASE_DB_PASSWORD=your_database_password
```

## Troubleshooting

### "Connection refused" or "ENOTFOUND"
- Verify your connection string is correct
- Check that you're using the pooler connection (port 6543 or 5432)
- Ensure your IP is not blocked (check Supabase Dashboard > Settings > Database > Connection pooling)

### "password authentication failed"
- Verify your database password is correct
- Try resetting the password in Supabase Dashboard
- Ensure you're using the database password, not the API key

### "pg package not found"
```bash
npm install --save-dev pg
```

### Connection works but migrations fail
- Check that you have proper database permissions
- Verify the migration SQL syntax is correct
- Check Supabase logs for detailed error messages

## Security Notes

- **Never commit .env.local to git** (it's already in .gitignore)
- The connection string contains your database password
- Use pooler connections (ports 6543/5432) for better performance
- Direct connections (port 5432) have connection limits

## Next Steps

After setting up the connection:

1. **Test Connection**
   ```bash
   node scripts/test-db-connection.js
   ```

2. **Run Migrations**
   ```bash
   npm run migrate
   ```

3. **Verify Migration**
   - Check Supabase Dashboard > Table Editor
   - Look for new tables: `campaign_versions`, `campaign_collaborators`, etc.

4. **Seed Templates** (Optional)
   ```bash
   npm run seed:templates
   ```



