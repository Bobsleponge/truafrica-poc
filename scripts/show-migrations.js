#!/usr/bin/env node

/**
 * Show Migration SQL for Manual Execution
 * 
 * This script displays migration SQL files in a format ready for copy-paste
 * into Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function header(message) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

async function main() {
  header('TruAfrica POC - Migration SQL Files');
  
  const migrationsDir = path.join(process.cwd(), 'lib', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return;
  }

  info(`Found ${migrationFiles.length} migration file(s)\n`);

  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`${colors.blue}${'─'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}Migration ${index + 1}: ${file}${colors.reset}`);
    console.log(`${colors.blue}${'─'.repeat(60)}${colors.reset}\n`);
    console.log(sql);
    console.log(`\n${colors.cyan}↑ Copy the SQL above and paste into Supabase SQL Editor${colors.reset}\n`);
  });

  info('To run these migrations:');
  info('1. Go to https://supabase.com/dashboard/project/gcixmuhaybldhfqanvaa');
  info('2. Click on "SQL Editor" in the left sidebar');
  info('3. Click "New query"');
  info('4. Copy and paste each migration SQL above');
  info('5. Click "Run" (or press Cmd/Ctrl + Enter)');
  info('6. Verify success message appears\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { main };




