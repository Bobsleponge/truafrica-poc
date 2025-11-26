#!/usr/bin/env node

/**
 * Get Supabase Connection String Helper
 * Helps extract connection string from Supabase project
 */

const { createClient } = require('@supabase/supabase-js')
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

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found')
  }
  
  const env = {}
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      env[key.trim()] = value.trim()
    }
  })
  return env
}

async function testConnectionFormats(projectRef, password) {
  const { Client } = require('pg')
  
  const formats = [
    {
      name: 'Direct Connection',
      string: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    },
    {
      name: 'Pooler Transaction (US East)',
      string: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    },
    {
      name: 'Pooler Transaction (EU West)',
      string: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    },
    {
      name: 'Pooler Session (US East)',
      string: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true`
    },
    {
      name: 'Pooler Session (EU West)',
      string: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true`
    },
  ]

  info('Testing connection formats...\n')

  for (const format of formats) {
    try {
      info(`Trying ${format.name}...`)
      const client = new Client({
        connectionString: format.string,
        ssl: { rejectUnauthorized: false }
      })
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      success(`${format.name} works!`)
      return format.string
    } catch (err) {
      // Continue to next format
    }
  }

  return null
}

async function main() {
  header('Get Supabase Connection String')

  try {
    const env = loadEnv()
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const password = env.SUPABASE_DB_PASSWORD
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      error('NEXT_PUBLIC_SUPABASE_URL not found')
      process.exit(1)
    }

    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (!projectRef) {
      error('Could not extract project reference from URL')
      process.exit(1)
    }

    info(`Project: ${projectRef}`)
    info(`URL: ${supabaseUrl}\n`)

    // If we have password, try to find working connection string
    if (password) {
      info('Testing connection formats with your password...')
      const workingConnection = await testConnectionFormats(projectRef, password)
      
      if (workingConnection) {
        success('Found working connection string!')
        
        // Update .env.local
        const envPath = path.join(process.cwd(), '.env.local')
        let envContent = fs.readFileSync(envPath, 'utf-8')
        
        // Remove existing connection string if any
        envContent = envContent.replace(/SUPABASE_DB_CONNECTION_STRING=.*\n/g, '')
        
        // Add new connection string
        if (!envContent.endsWith('\n')) {
          envContent += '\n'
        }
        envContent += `# Database connection (auto-detected)\n`
        envContent += `SUPABASE_DB_CONNECTION_STRING=${workingConnection}\n`
        
        fs.writeFileSync(envPath, envContent)
        success('Saved to .env.local!')
        
        info('\nYou can now run: npm run migrate')
        return
      }
    }

    // If we couldn't auto-detect, provide instructions
    error('Could not auto-detect connection string')
    info('\nPlease get it manually:')
    info('1. Go to: https://supabase.com/dashboard/project/' + projectRef)
    info('2. Settings > Database > Connection string > URI tab')
    info('3. Copy the connection string')
    info('4. Add to .env.local:')
    info('   SUPABASE_DB_CONNECTION_STRING=postgresql://...')
    info('\nOr continue using manual migration in SQL Editor')

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      error('pg package not found')
      info('Install it: npm install --save-dev pg')
    } else {
      error(`Error: ${err.message}`)
    }
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`)
    process.exit(1)
  })
}

module.exports = { main }



