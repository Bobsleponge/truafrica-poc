#!/usr/bin/env node

/**
 * Supabase Setup Helper Script
 * Provides step-by-step instructions and verification for Supabase setup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function header(text) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function step(num, text) {
  console.log(`${colors.blue}Step ${num}:${colors.reset} ${text}\n`);
}

function info(text) {
  console.log(`${colors.blue}ℹ${colors.reset} ${text}`);
}

function success(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function warning(text) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

function error(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  header('TruAfrica POC - Supabase Setup Helper');

  console.log('This script will guide you through setting up your Supabase project.\n');
  console.log('You will need:');
  console.log('  - A Supabase account (sign up at https://supabase.com)');
  console.log('  - Your Supabase project URL and API key\n');

  const proceed = await question('Ready to start? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run this script again when ready.');
    rl.close();
    return;
  }

  header('Phase 1: Create Supabase Project');

  step(1, 'Create Supabase Account');
  console.log('  1. Go to https://supabase.com');
  console.log('  2. Click "Start your project" or "Sign in"');
  console.log('  3. Sign up with GitHub, Google, or email\n');
  await question('Press Enter when you have signed in...');

  step(2, 'Create New Project');
  console.log('  1. Click "New Project" in your dashboard');
  console.log('  2. Fill in project details:');
  console.log('     - Name: truafrica-poc (or your preferred name)');
  console.log('     - Database Password: Choose a strong password (SAVE THIS!)');
  console.log('     - Region: Select closest to your target users');
  console.log('     - Pricing Plan: Free tier is sufficient\n');
  await question('Press Enter when project is created (wait 2-3 minutes for provisioning)...');

  header('Phase 2: Get API Credentials');

  step(1, 'Get Project URL and API Key');
  console.log('  1. In your Supabase project dashboard, go to Settings > API');
  console.log('  2. Copy the "Project URL" (starts with https://)');
  console.log('  3. Copy the "anon public" key (under Project API keys)\n');

  const supabaseUrl = await question('Enter your Project URL: ');
  const supabaseKey = await question('Enter your anon public key: ');

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
    error('Invalid credentials. Please try again.');
    rl.close();
    return;
  }

  header('Phase 3: Configure Environment Variables');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional: Reward API Integrations
# AIRTIME_API_KEY=
# MOBILE_MONEY_API_KEY=
# VOUCHER_API_KEY=
`;
  }

  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}`
  );

  fs.writeFileSync(envPath, envContent);
  success(`Environment variables saved to .env.local`);

  header('Phase 4: Run Database Migrations');

  step(1, 'Open SQL Editor');
  console.log('  1. In Supabase Dashboard, go to SQL Editor');
  console.log('  2. Click "New query"\n');

  const migration1Path = path.join(process.cwd(), 'lib/supabase/migrations/001_initial_schema.sql');
  const migration2Path = path.join(process.cwd(), 'lib/supabase/migrations/002_seed_data.sql');

  if (fs.existsSync(migration1Path)) {
    step(2, 'Run Initial Schema Migration');
    console.log('  1. Open the file: lib/supabase/migrations/001_initial_schema.sql');
    console.log('  2. Copy the entire contents');
    console.log('  3. Paste into SQL Editor');
    console.log('  4. Click "Run" (or press Cmd/Ctrl + Enter)');
    console.log('  5. Verify success message appears\n');
    await question('Press Enter when migration 001 is complete...');

    if (fs.existsSync(migration2Path)) {
      step(3, 'Run Seed Data Migration');
      console.log('  1. Open the file: lib/supabase/migrations/002_seed_data.sql');
      console.log('  2. Copy the entire contents');
      console.log('  3. Paste into SQL Editor');
      console.log('  4. Click "Run"');
      console.log('  5. Verify success message appears\n');
      await question('Press Enter when migration 002 is complete...');
    }
  } else {
    warning('Migration files not found. Please run migrations manually.');
  }

  header('Phase 5: Verify Setup');

  step(1, 'Verify Tables Created');
  console.log('  1. Go to Table Editor in Supabase Dashboard');
  console.log('  2. You should see 7 tables:');
  console.log('     - users');
  console.log('     - expertise_fields');
  console.log('     - questions');
  console.log('     - answers');
  console.log('     - rewards');
  console.log('     - ratings');
  console.log('     - company_dashboard_stats\n');
  await question('Press Enter when you have verified tables exist...');

  step(2, 'Verify Seed Data');
  console.log('  1. Click on "expertise_fields" table');
  console.log('  2. You should see 10 rows');
  console.log('  3. Verify fields like Technology, Agriculture, Healthcare exist\n');
  await question('Press Enter when you have verified seed data...');

  step(3, 'Test Database Connection');
  console.log('Running database connection test...\n');
  
  // Note: This would require the test-db-connection script
  console.log('Run: npm run setup:test-db');
  console.log('This will verify your connection and schema.\n');

  header('Phase 6: Configure Authentication');

  step(1, 'Configure Email Settings');
  console.log('  1. Go to Authentication > Settings');
  console.log('  2. Under "Email Auth":');
  console.log('     - Enable/Disable "Enable email confirmations" (optional for POC)');
  console.log('     - For testing, you may want to disable confirmations\n');

  step(2, 'Configure Redirect URLs');
  console.log('  1. Under "URL Configuration":');
  console.log('     - Site URL: http://localhost:3000');
  console.log('     - Redirect URLs: Add http://localhost:3000/**\n');
  await question('Press Enter when authentication is configured...');

  header('Setup Complete!');

  success('Supabase project is configured!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run setup:check (verify setup)');
  console.log('  2. Run: npm run setup:test-db (test connection)');
  console.log('  3. Run: npm run dev (start development server)');
  console.log('  4. Open: http://localhost:3000');
  console.log('\nFor detailed testing instructions, see: docs/TESTING.md\n');

  rl.close();
}

main().catch(err => {
  error(`Error: ${err.message}`);
  rl.close();
  process.exit(1);
});

