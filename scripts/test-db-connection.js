#!/usr/bin/env node

/**
 * Test Database Connection
 * Tests the database connection before running migrations
 */

const { Client } = require('pg')
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
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.blue}${message}${colors.reset}`)
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`)
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

async function testConnection() {
  header('Testing Database Connection')

  try {
    const env = loadEnv()
    const { Client } = require('pg')
    
    let connectionString
    
    if (env.SUPABASE_DB_CONNECTION_STRING) {
      info('Using SUPABASE_DB_CONNECTION_STRING')
      connectionString = env.SUPABASE_DB_CONNECTION_STRING
    } else if (env.SUPABASE_DB_PASSWORD && env.NEXT_PUBLIC_SUPABASE_URL) {
      info('Constructing connection string from password')
      const projectRef = env.NEXT_PUBLIC_SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
      if (!projectRef) {
        throw new Error('Could not extract project reference')
      }
      
      // Try multiple connection formats
      const connectionStrings = [
        // Format 1: Direct connection (most reliable)
        `postgresql://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`,
        // Format 2: Pooler transaction mode
        `postgresql://postgres.${projectRef}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
        // Format 3: Pooler session mode
        `postgresql://postgres.${projectRef}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-${projectRef}.pooler.supabase.com:5432/postgres?pgbouncer=true`,
        // Format 4: Alternative pooler format
        `postgresql://postgres.${projectRef}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      ]
      
      let lastError
      for (let i = 0; i < connectionStrings.length; i++) {
        try {
          info(`Trying connection format ${i + 1}...`)
          const testClient = new Client({
            connectionString: connectionStrings[i],
            ssl: { rejectUnauthorized: false }
          })
          await testClient.connect()
          await testClient.end()
          connectionString = connectionStrings[i]
          success(`Connection format ${i + 1} works!`)
          break
        } catch (err) {
          lastError = err
          if (i === connectionStrings.length - 1) {
            throw new Error(`All connection formats failed. Last error: ${lastError.message}`)
          }
        }
      }
    } else {
      error('No database connection configured')
      info('Run: npm run setup:db')
      process.exit(1)
    }

    info('Connecting to database...')
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()
    success('Connected successfully!')

    // Test query
    info('Testing query...')
    const result = await client.query('SELECT version()')
    success('Query executed successfully')
    
    info(`PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`)

    // Check if migration tables exist
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('campaign_versions', 'campaign_collaborators', 'campaign_approvals')
      ORDER BY table_name
    `)

    if (tables.length > 0) {
      info(`Found ${tables.length} migration table(s) already exist:`)
      tables.forEach(t => info(`  - ${t.table_name}`))
    } else {
      info('Migration tables not found - ready to run migrations')
    }

    await client.end()
    success('\nDatabase connection test passed!')
    info('You can now run: npm run migrate')

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      error('pg package not found')
      info('Install it: npm install --save-dev pg')
    } else {
      error(`Connection failed: ${err.message}`)
      info('\nTroubleshooting:')
      info('1. Verify your connection string/password is correct')
      info('2. Check Supabase Dashboard > Settings > Database')
      info('3. Ensure your IP is allowed (if using IP restrictions)')
      info('4. Try running: npm run setup:db')
    }
    process.exit(1)
  }
}

if (require.main === module) {
  testConnection().catch(err => {
    error(`Error: ${err.message}`)
    process.exit(1)
  })
}

module.exports = { testConnection }
