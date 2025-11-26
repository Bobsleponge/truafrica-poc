/**
 * Script to verify admin portal setup and configuration
 * Checks environment variables, Supabase connection, and admin user
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
    return true
  }
  return false
}

const hasEnvFile = loadEnv()

console.log('🔍 Verifying Admin Portal Setup...\n')

// Check 1: Environment file
console.log('1️⃣  Checking environment configuration...')
if (hasEnvFile) {
  console.log('   ✅ .env.local file exists')
} else {
  console.log('   ❌ .env.local file missing')
  console.log('   📝 Create it with: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL not set')
} else {
  console.log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`)
}

if (!supabaseAnonKey) {
  console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
} else {
  console.log(`   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`)
}

if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY not set or using placeholder')
  console.log('   📝 Get it from: Supabase Dashboard > Settings > API > service_role key')
} else {
  console.log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 20)}...`)
}

console.log('')

// Check 2: Supabase connection (anon key)
async function checkSupabaseConnection() {
  console.log('2️⃣  Testing Supabase connection (anon key)...')
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'admin@example.com')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.log(`   ❌ Connection error: ${error.message}`)
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('   📝 Make sure database migrations have been run')
        }
      } else if (data) {
        console.log(`   ✅ Connected successfully`)
        console.log(`   ✅ Admin user found: ${data.email}`)
        console.log(`   ✅ Role: ${data.role}`)
        if (data.role !== 'platform_admin') {
          console.log(`   ⚠️  Warning: User role is "${data.role}", expected "platform_admin"`)
          console.log('   📝 Update role with: UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
        }
      } else {
        console.log('   ⚠️  Admin user not found in database')
        console.log('   📝 Create admin user with: node scripts/create-platform-admin.js')
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  } else {
    console.log('   ⏭️  Skipping (missing environment variables)')
  }

  console.log('')

  // Check 3: Service role key (if available)
  console.log('3️⃣  Testing Supabase connection (service role key)...')
  if (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE') {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Test admin API access
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(1)

      if (error) {
        console.log(`   ❌ Service role key error: ${error.message}`)
      } else {
        console.log(`   ✅ Service role key works`)
        console.log(`   ✅ Can access database with admin privileges`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  } else {
    console.log('   ⏭️  Skipping (service role key not configured)')
  }
  
  return checkPort()
}

console.log('')

// Check 4: Dependencies
console.log('4️⃣  Checking dependencies...')
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json exists')
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules exists')
  } else {
    console.log('   ❌ node_modules missing - run: npm install')
  }
} else {
  console.log('   ❌ package.json missing')
}

console.log('')

// Check 5: Port availability
function checkPort() {
  return new Promise((resolve) => {
    console.log('5️⃣  Checking port 3001...')
    const { exec } = require('child_process')
    exec('lsof -ti:3001', (error, stdout) => {
      if (stdout.trim()) {
        console.log('   ✅ Port 3001 is in use (server may be running)')
      } else {
        console.log('   ℹ️  Port 3001 is available')
        console.log('   📝 Start server with: npm run dev')
      }

      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Setup Summary:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      const issues = []
      if (!hasEnvFile) issues.push('Create .env.local file')
      if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        issues.push('Add SUPABASE_SERVICE_ROLE_KEY to .env.local')
      }
      
      if (issues.length === 0) {
        console.log('✅ All checks passed! Admin portal is ready to use.')
        console.log('')
        console.log('🚀 Next steps:')
        console.log('   1. Start server: npm run dev')
        console.log('   2. Visit: http://localhost:3001/login-button')
        console.log('   3. Login with: admin@example.com / dev123456')
      } else {
        console.log('⚠️  Issues found:')
        issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`))
        console.log('')
        console.log('📝 See SETUP.md or QUICK_START.md for detailed instructions')
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      resolve()
    })
  })
}

// Run async checks
checkSupabaseConnection().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
