#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if the TruAfrica POC is properly configured
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function checkmark(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function cross(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

console.log('\n🔍 TruAfrica POC Setup Verification\n');
console.log('=' .repeat(50) + '\n');

let allChecksPassed = true;

// Check 1: Environment variables
console.log('📋 Checking Environment Variables...\n');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                         !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=your_');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                         !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    checkmark('Environment variables configured');
  } else {
    cross('Environment variables not properly configured');
    info('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    allChecksPassed = false;
  }
} else {
  cross('.env.local file not found');
  info('Copy .env.example to .env.local and fill in your Supabase credentials');
  allChecksPassed = false;
}

// Check 2: Migration files
console.log('\n📦 Checking Migration Files...\n');
const migration1 = path.join(process.cwd(), 'lib/supabase/migrations/001_initial_schema.sql');
const migration2 = path.join(process.cwd(), 'lib/supabase/migrations/002_seed_data.sql');

if (fs.existsSync(migration1)) {
  checkmark('Initial schema migration file exists');
} else {
  cross('Initial schema migration file not found');
  allChecksPassed = false;
}

if (fs.existsSync(migration2)) {
  checkmark('Seed data migration file exists');
} else {
  cross('Seed data migration file not found');
  allChecksPassed = false;
}

// Check 3: Node modules
console.log('\n📚 Checking Dependencies...\n');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  checkmark('Node modules installed');
  
  // Check key dependencies
  const keyDeps = [
    'next',
    '@supabase/supabase-js',
    '@supabase/ssr',
    'recharts',
    'react-hook-form',
  ];
  
  let missingDeps = [];
  keyDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    checkmark('Key dependencies installed');
  } else {
    cross(`Missing dependencies: ${missingDeps.join(', ')}`);
    info('Run: npm install');
    allChecksPassed = false;
  }
} else {
  cross('Node modules not installed');
  info('Run: npm install');
  allChecksPassed = false;
}

// Check 4: Key directories
console.log('\n📁 Checking Project Structure...\n');
const requiredDirs = [
  'app',
  'components',
  'lib',
  'lib/supabase',
  'lib/utils',
  'types',
];
requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    checkmark(`Directory exists: ${dir}`);
  } else {
    cross(`Directory missing: ${dir}`);
    allChecksPassed = false;
  }
});

// Check 5: Key files
console.log('\n📄 Checking Key Files...\n');
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
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    checkmark(`File exists: ${file}`);
  } else {
    cross(`File missing: ${file}`);
    allChecksPassed = false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log(`\n${colors.green}✅ All checks passed!${colors.reset}`);
  console.log('\nNext steps:');
  console.log('1. Set up your Supabase project at https://supabase.com');
  console.log('2. Run the migration files in Supabase SQL Editor');
  console.log('3. Start the dev server: npm run dev');
  console.log('4. Test the application workflows\n');
} else {
  console.log(`\n${colors.red}❌ Some checks failed${colors.reset}`);
  console.log('\nPlease fix the issues above before proceeding.\n');
  process.exit(1);
}

