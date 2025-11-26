#!/usr/bin/env node

/**
 * Run Migration 004 via Supabase REST API
 * This uses the Supabase client to execute SQL via the REST API
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

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
  header('Running Migration 004: Campaign Builder Extensions')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    error('Missing required environment variables')
    info('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    info('Add these to your .env.local file')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', '004_campaign_builder_extensions.sql')
  
  if (!fs.existsSync(migrationPath)) {
    error(`Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  info('Executing migration via Supabase REST API...')
  info('Note: This requires the service_role key with database access')

  try {
    // Split SQL into individual statements
    // Remove comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^\s*$/

))

    info(`Found ${statements.length} SQL statements to execute`)

    // Execute via RPC or direct SQL
    // Note: Supabase REST API doesn't directly support arbitrary SQL execution
    // We need to use the PostgREST or provide instructions for manual execution
    
    info('\n⚠️  Direct SQL execution via REST API is limited')
    info('Please use one of these methods:\n')
    
    info('Method 1: Supabase Dashboard (Recommended)')
    info('1. Go to your Supabase project dashboard')
    info('2. Navigate to SQL Editor')
    info('3. Copy and paste the migration SQL')
    info('4. Click "Run" to execute\n')
    
    info('Method 2: Supabase CLI')
    info('1. Install Supabase CLI: npm install -g supabase')
    info('2. Login: supabase login')
    info('3. Link project: supabase link --project-ref YOUR_PROJECT_REF')
    info('4. Push migration: supabase db push\n')
    
    info('Method 3: Direct Database Connection')
    info('1. Get connection string from Supabase Dashboard')
    info('2. Settings > Database > Connection string > URI')
    info('3. Use psql or any PostgreSQL client to run the migration\n')

    // Show the migration SQL
    console.log('\n' + colors.blue + 'Migration SQL:' + colors.reset)
    console.log('─'.repeat(60))
    console.log(sql.substring(0, 500) + '...\n')
    console.log('─'.repeat(60))
    info(`Full migration file: ${migrationPath}`)
    
    // Try to execute via Supabase Management API if available
    // This is a fallback - most users will need to use the dashboard
    info('\nAttempting to check migration status...')
    
    // Check if tables already exist
    const { data: tables, error: tablesError } = await supabase
      .from('campaign_versions')
      .select('id')
      .limit(1)

    if (!tablesError) {
      warning('Migration may have already been applied (campaign_versions table exists)')
    } else if (tablesError.code === 'PGRST116') {
      info('Table does not exist - migration needs to be run')
    }

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



