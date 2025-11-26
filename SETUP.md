# TruAfrica POC - Setup Guide

This guide will walk you through setting up the TruAfrica POC platform step by step.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- Git (optional, for cloning)

## Phase 1: Supabase Project Setup

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: `truafrica-poc` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select region closest to your target users
   - **Pricing Plan**: Free tier is sufficient for POC
4. Click "Create new project"
5. Wait 2-3 minutes for project provisioning

### Step 1.2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

You'll need these in the next step.

### Step 1.3: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Open the file `lib/supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success message appears
8. Repeat for `lib/supabase/migrations/002_seed_data.sql`

**Verification:**
- Go to **Table Editor** in Supabase Dashboard
- You should see 7 tables:
  - `users`
  - `expertise_fields`
  - `questions`
  - `answers`
  - `rewards`
  - `ratings`
  - `company_dashboard_stats`
- Check `expertise_fields` table should have 10 rows

### Step 1.4: Configure Authentication

1. Go to **Authentication** > **Settings**
2. Under **Email Auth**:
   - Enable "Enable email confirmations" (optional for POC - disable for easier testing)
   - Configure email templates if needed
3. Under **URL Configuration**:
   - Add `http://localhost:3000/**` to Site URL
   - Add `http://localhost:3000/**` to Redirect URLs
4. (Optional) Configure OAuth providers:
   - Go to **Providers**
   - Enable Google, GitHub, etc. for easier testing

## Phase 2: Local Environment Configuration

### Step 2.1: Install Dependencies

```bash
cd truafrica-poc
npm install
```

This will install all required packages including:
- Next.js 14
- Supabase client libraries
- shadcn/ui components
- Recharts for charts
- React Hook Form + Zod

### Step 2.2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your editor

3. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   ```

   Replace `[your-project-id]` and `[your-anon-key]` with values from Step 1.2

4. Save the file

**Important:** Never commit `.env.local` to git (it's already in `.gitignore`)

### Step 2.3: Verify Setup

Run the setup verification script:

```bash
node scripts/setup-check.js
```

This will check:
- ✅ Environment variables are configured
- ✅ Migration files exist
- ✅ Dependencies are installed
- ✅ Project structure is correct

### Step 2.4: Test Database Connection

```bash
node scripts/test-db-connection.js
```

This will verify:
- ✅ Connection to Supabase works
- ✅ All tables exist
- ✅ Seed data is present
- ✅ Tables are accessible

### Step 2.5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the TruAfrica landing page.

## Phase 3: Testing Workflows

### Test Contributor Flow

1. **Sign Up as Contributor**
   - Go to `/signup?role=contributor`
   - Fill in the form:
     - Name: "Test Contributor"
     - Email: `test.contributor@example.com`
     - Password: (choose a secure password)
     - Country: Select any African country
     - Languages: Select 2-3 languages
     - Expertise: Select 2-3 fields
   - Click "Sign Up"
   - Should redirect to `/contributor/onboarding`

2. **Complete Onboarding**
   - Answer all 5 onboarding questions
   - Provide detailed answers (50+ characters each)
   - Click "Complete Onboarding"
   - Should redirect to `/contributor/dashboard`
   - Trust score should be displayed (40-80 range)

3. **View Dashboard**
   - Verify trust score badge shows correct value
   - Check that stats show 0 answers and 0 rewards initially
   - Click "Browse Questions" to see available questions

4. **Answer Questions** (if questions exist)
   - Go to `/contributor/questions`
   - Click "Answer" on a question
   - Submit a detailed answer
   - Verify success message
   - Check dashboard for updated stats

### Test Company Flow

1. **Sign Up as Company**
   - Go to `/signup?role=company`
   - Fill in the form:
     - Company Name: "Test Company"
     - Email: `test.company@example.com`
     - Password: (choose a secure password)
     - Country: Select any African country
   - Click "Sign Up"
   - Should redirect to `/company/dashboard`

2. **View Dashboard**
   - Verify stats cards show zeros initially
   - Check that questions and answers tables are empty

3. **Upload Questions**
   - Click "Upload New Question"
   - Create a question:
     - Select an expertise field
     - Choose difficulty level
     - Enter question content
   - Click "Submit Question"
   - Verify question appears in dashboard

4. **View Answers** (after contributors answer)
   - As a company, view the answers to your questions
   - Check that consensus scores are calculated
   - Verify charts update with data
   - Test filters (by field, difficulty)

### Test Integration

1. **Consensus Calculation**
   - Create a question as a company
   - Have multiple contributors answer it
   - Verify:
     - First answer gets 100% consensus (no comparison)
     - Similar answers get high consensus (>70%)
     - Different answers get low consensus (<70%)

2. **Trust Score Updates**
   - Track a contributor's trust score
   - Submit a correct answer (consensus >70%)
   - Verify trust score increases
   - Submit an incorrect answer
   - Verify trust score decreases

3. **Reward Allocation**
   - Submit a correct answer
   - Verify reward appears in contributor dashboard
   - Check reward details (type, value, status)

## Troubleshooting

### Database Connection Issues

**Problem:** "Invalid API key" or connection errors

**Solutions:**
- Verify `.env.local` has correct values
- Check Supabase project is active
- Ensure you copied the `anon public` key (not `service_role`)
- Try regenerating API keys in Supabase Dashboard

### Migration Errors

**Problem:** SQL migration fails

**Solutions:**
- Check error message in Supabase SQL Editor
- Ensure you're running migrations in order (001 then 002)
- Verify no tables already exist (drop them if needed)
- Check for syntax errors in SQL

### Authentication Issues

**Problem:** Can't sign up or login

**Solutions:**
- Check email confirmation is disabled (for testing)
- Verify redirect URLs in Supabase Auth settings
- Clear browser cookies
- Check browser console for errors

### Missing Tables

**Problem:** Tables don't appear after migration

**Solutions:**
- Verify migration ran successfully (check SQL Editor history)
- Refresh Table Editor in Supabase Dashboard
- Check for errors in migration SQL
- Ensure you're in the correct project

### TypeScript Errors

**Problem:** Type errors when running `npm run dev`

**Solutions:**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version: `npx tsc --version`
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

## Next Steps

After successful setup:

1. ✅ Explore the contributor and company dashboards
2. ✅ Test the complete workflows
3. ✅ Review the code structure
4. ✅ Customize branding and styling
5. ✅ Prepare for production deployment

## Getting Help

- Check the [README.md](./README.md) for detailed documentation
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

**Happy coding! 🚀**

