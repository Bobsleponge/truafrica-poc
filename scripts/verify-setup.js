#!/usr/bin/env node

/**
 * Complete Setup Verification Script
 * Runs all verification checks and provides next steps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function verifySetup() {
  header('TruAfrica POC - Complete Setup Verification');

  let allPassed = true;

  // Check 1: Project Structure
  console.log('1. Checking Project Structure...\n');
  try {
    execSync('node scripts/setup-check.js', { stdio: 'inherit' });
    success('Project structure verified');
  } catch (err) {
    error('Project structure check failed');
    allPassed = false;
  }

  // Check 2: Database Connection
  console.log('\n2. Testing Database Connection...\n');
  try {
    execSync('node scripts/test-db-connection.js', { stdio: 'inherit' });
    success('Database connection verified');
  } catch (err) {
    error('Database connection test failed');
    warning('Make sure you have:');
    warning('  - Created Supabase project');
    warning('  - Run database migrations');
    warning('  - Configured .env.local');
    allPassed = false;
  }

  // Check 3: Environment Variables
  console.log('\n3. Checking Environment Variables...\n');
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                   !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=your_');
    const hasKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                   !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_');
    
    if (hasUrl && hasKey) {
      success('Environment variables configured');
    } else {
      error('Environment variables not properly configured');
      info('Run: npm run setup:supabase');
      allPassed = false;
    }
  } else {
    error('.env.local file not found');
    info('Run: npm run setup:supabase');
    allPassed = false;
  }

  // Check 4: Dependencies
  console.log('\n4. Checking Dependencies...\n');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    success('Dependencies installed');
  } else {
    error('Dependencies not installed');
    info('Run: npm install');
    allPassed = false;
  }

  // Summary
  header('Verification Summary');

  if (allPassed) {
    success('All checks passed! Your setup is complete.\n');
    console.log('Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Open http://localhost:3000');
    console.log('  3. Sign up as contributor or company');
    console.log('  4. Follow testing guide: docs/TESTING.md\n');
  } else {
    error('Some checks failed. Please fix the issues above.\n');
    console.log('Setup guides:');
    console.log('  - Quick setup: npm run setup:supabase');
    console.log('  - Detailed guide: SETUP.md');
    console.log('  - Troubleshooting: See SETUP.md\n');
    process.exit(1);
  }
}

verifySetup().catch(err => {
  error(`Verification failed: ${err.message}`);
  process.exit(1);
});

