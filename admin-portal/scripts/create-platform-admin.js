/**
 * Script to create a platform admin user for the admin portal
 * 
 * Usage:
 *   node scripts/create-platform-admin.js [email] [password] [name]
 * 
 * Example:
 *   node scripts/create-platform-admin.js admin@truafrica.com SecurePass123 "Admin User"
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
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

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  console.error('\nTo get your service role key:')
  console.error('1. Go to Supabase Dashboard > Settings > API')
  console.error('2. Copy the "service_role" key (keep it secret!)')
  console.error('3. Add it to admin-portal/.env.local as SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Get arguments
const email = process.argv[2] || 'admin@truafrica.com'
const password = process.argv[3] || 'admin123456'
const name = process.argv[4] || 'Platform Admin'

async function createPlatformAdmin() {
  console.log('🚀 Creating platform admin user...\n')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Name: ${name}\n`)

  try {
    // Create auth user
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm for admin users
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`  ⚠️  User ${email} already exists in auth.users`)
        
        // Try to get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === email)
        
        if (existingUser) {
          console.log(`  ✅ Found existing user, updating profile...`)
          
          // Update user profile with platform_admin role
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: existingUser.id,
              email: email,
              role: 'platform_admin',
              name: name,
              onboarding_completed: false,
            }, {
              onConflict: 'id'
            })

          if (updateError) {
            console.error(`  ❌ Error updating profile:`, updateError.message)
            process.exit(1)
          }

          console.log(`  ✅ User profile updated with platform_admin role`)
          console.log(`\n✅ Platform admin user ready!`)
          console.log(`\n📝 Login Credentials:`)
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
          console.log(`Email: ${email}`)
          console.log(`Password: ${password}`)
          console.log(`Admin Portal: http://localhost:3001/login`)
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
          return
        }
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user returned from auth creation')
    }

    console.log(`  ✅ Auth user created: ${authData.user.id}`)

    // Create user profile with platform_admin role
    console.log('Creating user profile with platform_admin role...')
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        role: 'platform_admin',
        name: name,
        onboarding_completed: false,
      })

    if (profileError) {
      // If profile already exists, try to update it
      if (profileError.code === '23505') {
        console.log(`  ⚠️  Profile already exists, updating...`)
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: 'platform_admin',
            name: name,
          })
          .eq('id', authData.user.id)

        if (updateError) throw updateError
        console.log(`  ✅ Profile updated with platform_admin role`)
      } else {
        throw profileError
      }
    } else {
      console.log(`  ✅ Profile created with platform_admin role`)
    }

    console.log(`\n✅ Platform admin user created successfully!`)
    console.log(`\n📝 Login Credentials:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Admin Portal: http://localhost:3001/login`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  } catch (error) {
    console.error(`  ❌ Error:`, error.message)
    process.exit(1)
  }
}

// Run the script
createPlatformAdmin().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})



