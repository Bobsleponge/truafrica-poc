# Dev Login Guide

Quick guide to login and test the TruAfrica application.

## Quick Setup

### 1. Run Migrations

Make sure all migrations are run (including the new campaign migrations):

```bash
npm run migrate
```

### 2. Seed Pricing Rules

Seed default pricing rules for the pricing engine:

```bash
npm run seed:pricing
```

Or run the SQL migration directly:
```bash
# The migration file is at: lib/supabase/migrations/004_seed_pricing_rules.sql
```

### 3. Create Dev Users

Run the script to create test accounts:

```bash
npm run dev:users
```

This creates four test accounts:
- **Contributor**: `contributor@example.com` / `dev123456`
- **Company**: `company@example.com` / `dev123456`
- **Contributor 2**: `contributor2@example.com` / `dev123456`
- **Admin**: `admin@example.com` / `dev123456`

### 4. (Optional) Test Campaign Creation

Test the campaign creation flow:

```bash
npm run test:campaign
```

This creates a test campaign to verify everything is working.

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Login

1. Go to http://localhost:3000
2. Click "Login" in the header
3. Use one of the test accounts above

## Test Accounts

### Contributor Account
- **Email**: `contributor@example.com`
- **Password**: `dev123456`
- **Trust Score**: 75
- **Onboarding**: Completed
- **Dashboard**: http://localhost:3000/contributor/dashboard

### Company Account
- **Email**: `company@example.com`
- **Password**: `dev123456`
- **Dashboard**: http://localhost:3000/company/dashboard

### Additional Contributor
- **Email**: `contributor2@example.com`
- **Password**: `dev123456`
- **Trust Score**: 60
- **Onboarding**: Completed

### Admin Account
- **Email**: `admin@example.com`
- **Password**: `dev123456`
- **Dashboard**: http://localhost:3000/admin/validation

## Manual Signup (Alternative)

If you prefer to create your own account:

1. Go to http://localhost:3000/auth/signup
2. Choose your role (Contributor or Company)
3. Fill in the form
4. You'll be redirected to your dashboard

## Troubleshooting

### "User already exists" error
- The user already exists in Supabase
- Just use the login credentials above

### "Service role key required" error
- The script needs the service role key to create users
- Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file
- Find it in Supabase Dashboard > Settings > API > service_role key

### Can't login after creating user
- Check that email confirmation is disabled in Supabase (for dev)
- Go to Authentication > Settings > Email Auth
- Disable "Enable email confirmations" for easier testing

## Features to Test

### As Contributor:
- View available questions
- Answer questions
- See trust score
- View reward history
- Complete onboarding (if not done)

### As Company:
- Create campaigns
- Upload questions or request TruAfrica to design them
- View campaign metrics and insights
- Export data (CSV/JSON)
- Generate API keys
- Track pricing and margins

### As Admin:
- Review campaigns needing question design
- Resolve flagged answers in validation queue
- Manage pricing rules
- View system-wide statistics

