#!/usr/bin/env node

/**
 * Prepare Migration 004 for Manual Execution
 * Outputs the migration SQL in a format ready for Supabase Dashboard
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`)
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`)
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`)
}

function header(message) {
  console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}${message}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`)
}

async function main() {
  header('Migration 004: Campaign Builder Extensions - Ready for Execution')

  const migrationPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', '004_campaign_builder_extensions.sql')
  
  if (!fs.existsSync(migrationPath)) {
    error(`Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  info('Migration SQL is ready!')
  info('\n📋 INSTRUCTIONS TO RUN MIGRATION:\n')
  
  console.log(`${colors.cyan}1.${colors.reset} Go to your Supabase Dashboard`)
  console.log(`   ${colors.yellow}→${colors.reset} https://supabase.com/dashboard`)
  console.log(`   ${colors.yellow}→${colors.reset} Select your project\n`)
  
  console.log(`${colors.cyan}2.${colors.reset} Open SQL Editor`)
  console.log(`   ${colors.yellow}→${colors.reset} Click "SQL Editor" in the left sidebar`)
  console.log(`   ${colors.yellow}→${colors.reset} Click "New query" button\n`)
  
  console.log(`${colors.cyan}3.${colors.reset} Copy the migration SQL below`)
  console.log(`   ${colors.yellow}→${colors.reset} The SQL is shown below (${sql.split('\n').length} lines)`)
  console.log(`   ${colors.yellow}→${colors.reset} Or open: ${migrationPath}\n`)
  
  console.log(`${colors.cyan}4.${colors.reset} Paste and Run`)
  console.log(`   ${colors.yellow}→${colors.reset} Paste the SQL into the SQL Editor`)
  console.log(`   ${colors.yellow}→${colors.reset} Click "Run" button (or press Cmd/Ctrl + Enter)\n`)
  
  console.log(`${colors.cyan}5.${colors.reset} Verify Success`)
  console.log(`   ${colors.yellow}→${colors.reset} You should see "Success. No rows returned"`)
  console.log(`   ${colors.yellow}→${colors.reset} Check Table Editor to see new tables\n`)

  console.log(`${colors.blue}${'─'.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}MIGRATION SQL (Copy everything below this line)${colors.reset}`)
  console.log(`${colors.blue}${'─'.repeat(70)}${colors.reset}\n`)

  // Output the SQL
  console.log(sql)

  console.log(`\n${colors.blue}${'─'.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}END OF MIGRATION SQL${colors.reset}`)
  console.log(`${colors.blue}${'─'.repeat(70)}${colors.reset}\n`)

  success('Migration SQL ready for execution!')
  info(`File location: ${migrationPath}`)
  info('\n💡 Tip: You can also view this file directly in your editor')
}

if (require.main === module) {
  main().catch(err => {
    error(`Error: ${err.message}`)
    process.exit(1)
  })
}

module.exports = { main }



