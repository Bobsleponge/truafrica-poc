# TruAfrica POC - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier works)

## Quick Setup (5 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

Run the interactive setup script:

```bash
npm run setup:supabase
```

This will guide you through:
- Creating a Supabase project
- Getting API credentials
- Running database migrations
- Configuring authentication

**Or** follow the manual steps in [SETUP.md](./SETUP.md)

### Step 3: Verify Setup

Run the verification script:

```bash
npm run setup:verify
```

This checks:
- ✅ Project structure
- ✅ Database connection
- ✅ Environment variables
- ✅ Dependencies

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Open in Browser

Go to: **http://localhost:3000**

## First Steps

1. **Sign up as Contributor**:
   - Go to `/signup?role=contributor`
   - Complete onboarding
   - Start answering questions

2. **Sign up as Company**:
   - Go to `/signup?role=company`
   - Upload questions
   - View analytics

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run setup:check` - Check project setup
- `npm run setup:test-db` - Test database connection
- `npm run setup:supabase` - Interactive Supabase setup
- `npm run setup:verify` - Complete setup verification
- `npm run test:data` - Get test data creation help

## Troubleshooting

### Environment Variables Not Set

```bash
npm run setup:supabase
```

### Database Connection Fails

1. Verify Supabase project is active
2. Check `.env.local` has correct credentials
3. Ensure migrations have been run

### Build Errors

The dev server works fine. If you encounter build errors:
- Use `npm run dev` for development
- See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production builds

## Next Steps

- 📖 Read [SETUP.md](./SETUP.md) for detailed setup
- 🧪 Follow [TESTING.md](./docs/TESTING.md) for testing scenarios
- 🚀 See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment
- ✅ Use [CHECKLIST.md](./CHECKLIST.md) to track progress

## Need Help?

- Check [SETUP.md](./SETUP.md) for detailed instructions
- Review [TESTING.md](./docs/TESTING.md) for testing help
- See [README.md](./README.md) for full documentation

---

**Ready to go?** Run `npm run setup:supabase` to get started! 🚀

