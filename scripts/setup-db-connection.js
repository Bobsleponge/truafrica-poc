#!/usr/bin/env node

/**
 * Setup Database Connection for Migrations
 * Helps configure direct database connection for running migrations
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

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

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`)
}

function header(message) {
  console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.blue}${message}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  header('Database Connection Setup for Migrations')

  info('This will help you set up direct database connection for running migrations.')
  info('You need your Supabase database password or connection string.\n')

  console.log(`${colors.yellow}How to get your database connection details:${colors.reset}`)
  console.log('1. Go to: https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Go to: Settings > Database')
  console.log('4. Find "Connection string" section')
  console.log('5. Copy either:')
  console.log('   - The "URI" connection string (recommended), OR')
  console.log('   - Your database password\n')

  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
    info(`Found existing .env.local file`)
  } else {
    info('Creating new .env.local file')
  }

  // Check if already configured
  if (envContent.includes('SUPABASE_DB_PASSWORD') || envContent.includes('SUPABASE_DB_CONNECTION_STRING')) {
    warning('Database connection already configured in .env.local')
    const overwrite = await question('Do you want to update it? (y/n): ')
    if (overwrite.toLowerCase() !== 'y') {
      info('Keeping existing configuration')
      rl.close()
      return
    }
  }

  console.log(`\n${colors.cyan}Connection Method:${colors.reset}`)
  console.log('1. Connection String (URI) - Recommended')
  console.log('2. Database Password (will construct connection string)\n')

  const method = await question('Choose method (1 or 2): ')

  if (method === '1') {
    // Connection string method
    info('\nUsing Connection String method')
    const connectionString = await question('Paste your Supabase connection string (URI): ')
    
    if (!connectionString || !connectionString.startsWith('postgresql://')) {
      error('Invalid connection string. Must start with postgresql://')
      rl.close()
      process.exit(1)
    }

    // Remove existing SUPABASE_DB_PASSWORD if exists
    envContent = envContent.replace(/SUPABASE_DB_PASSWORD=.*\n/g, '')
    envContent = envContent.replace(/SUPABASE_DB_CONNECTION_STRING=.*\n/g, '')

    // Add connection string
    if (!envContent.endsWith('\n') && envContent.length > 0) {
      envContent += '\n'
    }
    envContent += `# Database connection for migrations\n`
    envContent += `SUPABASE_DB_CONNECTION_STRING=${connectionString.trim()}\n`

  } else if (method === '2') {
    // Password method
    info('\nUsing Database Password method')
    const password = await question('Enter your Supabase database password: ')
    
    if (!password) {
      error('Password is required')
      rl.close()
      process.exit(1)
    }

    // Remove existing connection string if exists
    envContent = envContent.replace(/SUPABASE_DB_CONNECTION_STRING=.*\n/g, '')
    envContent = envContent.replace(/SUPABASE_DB_PASSWORD=.*\n/g, '')

    // Add password
    if (!envContent.endsWith('\n') && envContent.length > 0) {
      envContent += '\n'
    }
    envContent += `# Database connection for migrations\n`
    envContent += `SUPABASE_DB_PASSWORD=${password.trim()}\n`

  } else {
    error('Invalid choice')
    rl.close()
    process.exit(1)
  }

  // Write to .env.local
  fs.writeFileSync(envPath, envContent)
  success('Database connection configured in .env.local')

  info('\nNext steps:')
  info('1. Run migrations: npm run migrate')
  info('2. Or test connection first: node scripts/test-db-connection.js\n')

  rl.close()
}

if (require.main === module) {
  main().catch(err => {
    error(`Error: ${err.message}`)
    console.error(err)
    process.exit(1)
  })
}

module.exports = { main }



