/**
 * Verify that admin role has been fixed
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
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
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyRole() {
  console.log('🔍 Verifying admin role...\n')

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle()

    if (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }

    if (!user) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log(`User: ${user.email}`)
    console.log(`Role: ${user.role}`)
    console.log('')

    if (user.role === 'platform_admin') {
      console.log('✅ SUCCESS! Admin user has platform_admin role!')
      console.log('')
      console.log('🎉 Admin portal is ready to use!')
      console.log('')
      console.log('Next steps:')
      console.log('  1. Start server: npm run dev')
      console.log('  2. Visit: http://localhost:3001/login-button')
      console.log('  3. Login: admin@example.com / dev123456')
    } else {
      console.log(`❌ Role is "${user.role}", expected "platform_admin"`)
      console.log('')
      console.log('📝 Please run the SQL in FIX_ROLE_CORRECT.md')
      console.log('   (Run the two SQL statements separately)')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

verifyRole()



