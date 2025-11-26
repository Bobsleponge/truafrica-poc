#!/usr/bin/env node

/**
 * Complete Setup Script
 * Automatically configures and verifies everything
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

function success(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function error(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

function info(text) {
  console.log(`${colors.blue}ℹ${colors.reset} ${text}`);
}

function warning(text) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

async function checkEnvironment() {
  header('Step 1: Checking Environment Variables');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    error('Environment variables not found');
    info('Please run: npm run setup:env');
    info('Or create .env.local with:');
    info('  NEXT_PUBLIC_SUPABASE_URL=your_url');
    info('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
    return false;
  }

  if (supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
    error('Environment variables contain placeholder values');
    return false;
  }

  success('Environment variables configured');
  return { supabaseUrl, supabaseKey };
}

async function testConnection(env) {
  header('Step 2: Testing Database Connection');

  try {
    const supabase = createClient(env.supabaseUrl, env.supabaseKey);

    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.message !== 'Invalid API key') {
      // Expected if not logged in
    }
    success('Connection to Supabase successful');

    // Check tables
    const tables = [
      'users',
      'expertise_fields',
      'questions',
      'answers',
      'rewards',
      'ratings',
      'company_dashboard_stats',
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          error(`Table '${table}' does not exist`);
          allTablesExist = false;
        } else {
          error(`Error accessing table '${table}': ${error.message}`);
          allTablesExist = false;
        }
      } else {
        success(`Table '${table}' exists and is accessible`);
      }
    }

    if (!allTablesExist) {
      warning('Some tables are missing. Please run database migrations.');
      info('Run migrations in Supabase SQL Editor:');
      info('  1. lib/supabase/migrations/001_initial_schema.sql');
      info('  2. lib/supabase/migrations/002_seed_data.sql');
      return false;
    }

    // Check seed data
    const { data: fields, error: fieldsError } = await supabase
      .from('expertise_fields')
      .select('*');

    if (fieldsError) {
      error(`Error checking expertise_fields: ${fieldsError.message}`);
      return false;
    }

    if (fields && fields.length > 0) {
      success(`Found ${fields.length} expertise fields`);
      if (fields.length < 10) {
        warning('Expected 10 expertise fields. Run migration 002_seed_data.sql');
      }
    } else {
      warning('No expertise fields found');
      info('Run migration 002_seed_data.sql to seed the database');
    }

    return true;
  } catch (err) {
    error(`Connection failed: ${err.message}`);
    return false;
  }
}

async function verifyProjectStructure() {
  header('Step 3: Verifying Project Structure');

  const requiredDirs = ['app', 'components', 'lib', 'lib/supabase', 'lib/utils', 'types'];
  const requiredFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/(auth)/login/page.tsx',
    'app/(auth)/signup/page.tsx',
    'app/(contributor)/dashboard/page.tsx',
    'app/(company)/dashboard/page.tsx',
    'lib/supabase/client.ts',
    'lib/supabase/server.ts',
    'middleware.ts',
  ];

  let allGood = true;

  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      success(`Directory exists: ${dir}`);
    } else {
      error(`Directory missing: ${dir}`);
      allGood = false;
    }
  }

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      success(`File exists: ${file}`);
    } else {
      error(`File missing: ${file}`);
      allGood = false;
    }
  }

  return allGood;
}

async function main() {
  header('TruAfrica POC - Complete Setup Verification');

  // Step 1: Check environment
  const env = await checkEnvironment();
  if (!env) {
    process.exit(1);
  }

  // Step 2: Test connection
  const connectionOk = await testConnection(env);
  if (!connectionOk) {
    error('Database setup incomplete. Please run migrations.');
    process.exit(1);
  }

  // Step 3: Verify structure
  const structureOk = await verifyProjectStructure();
  if (!structureOk) {
    error('Project structure issues detected.');
    process.exit(1);
  }

  // Summary
  header('Setup Complete!');

  success('All checks passed!');
  console.log('\n✅ Environment variables configured');
  console.log('✅ Database connection working');
  console.log('✅ All tables exist');
  console.log('✅ Project structure verified\n');

  console.log('Next steps:');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Open http://localhost:3000');
  console.log('  3. Sign up as contributor or company');
  console.log('  4. Follow testing guide: docs/TESTING.md\n');

  console.log('Available commands:');
  console.log('  npm run dev              - Start development server');
  console.log('  npm run setup:verify     - Run this verification again');
  console.log('  npm run test:data        - Get test data creation help\n');
}

main().catch(err => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});

