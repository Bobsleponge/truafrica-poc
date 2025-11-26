#!/usr/bin/env node

/**
 * Execute Migration 004 via Supabase REST API
 * Uses the Supabase client to execute SQL via RPC functions
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env vars manually (no dotenv dependency)
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
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.blue}${message}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`)
}

async function main() {
  header('Migration 004: Campaign Builder Extensions')

  try {
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      error('Missing required environment variables')
      info('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
      info('\nPlease use the Supabase Dashboard method instead:')
      info('1. Go to Supabase Dashboard > SQL Editor')
      info('2. Copy contents of lib/supabase/migrations/004_campaign_builder_extensions.sql')
      info('3. Paste and run')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', '004_campaign_builder_extensions.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    info('Note: Supabase REST API does not support arbitrary SQL execution')
    info('The migration must be run manually in the Supabase Dashboard\n')

    info('Migration file location:')
    info(`  ${migrationPath}\n`)

    info('To run this migration:')
    info('1. Go to: https://supabase.com/dashboard')
    info('2. Select your project')
    info('3. Click "SQL Editor" in the left sidebar')
    info('4. Click "New query"')
    info('5. Copy and paste the entire migration SQL')
    info('6. Click "Run" (or press Cmd/Ctrl + Enter)\n')

    // Check if migration already applied
    info('Checking if migration has been applied...')
    
    const { data: versions, error: versionsError } = await supabase
      .from('campaign_versions')
      .select('id')
      .limit(1)

    if (!versionsError) {
      success('Migration appears to be already applied (campaign_versions table exists)')
    } else if (versionsError.code === 'PGRST116' || versionsError.message.includes('does not exist')) {
      info('Migration not yet applied - please run it in Supabase Dashboard')
    } else {
      warning(`Could not verify: ${versionsError.message}`)
    }

    // Show first few lines of migration
    console.log(`\n${colors.blue}Migration SQL Preview:${colors.reset}`)
    console.log('─'.repeat(60))
    const lines = sql.split('\n').slice(0, 20)
    lines.forEach(line => console.log(line))
    console.log('...')
    console.log('─'.repeat(60))
    info(`Full migration: ${migrationPath}`)

  } catch (err) {
    error(`Error: ${err.message}`)
    console.error(err)
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



