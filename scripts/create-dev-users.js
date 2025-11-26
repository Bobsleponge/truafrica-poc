/**
 * Script to create development/test users in Supabase
 * 
 * This script creates test users for contributor, client, team account, and platform admin roles
 * so you can quickly test the application.
 * 
 * Usage:
 *   node scripts/create-dev-users.js
 * 
 * Prerequisites:
 *   - Supabase project must be set up
 *   - Environment variables must be configured (.env.local)
 *   - Database migrations must be run
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  console.error('\nNote: For creating users, you may need to use the service role key.')
  console.error('You can find it in Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const devUsers = [
  {
    email: 'contributor@example.com',
    password: 'dev123456',
    role: 'contributor',
    name: 'Test Contributor',
    country: 'Nigeria',
    languages: ['English', 'Hausa'],
    expertise_fields: ['Technology', 'Education'],
    trust_score: 75,
    onboarding_completed: true
  },
  {
    email: 'client@example.com',
    password: 'dev123456',
    role: 'client_owner',
    name: 'Test Client',
    country: 'South Africa',
    languages: [],
    expertise_fields: [],
    trust_score: null,
    onboarding_completed: false
  },
  {
    email: 'contributor2@example.com',
    password: 'dev123456',
    role: 'contributor',
    name: 'Another Contributor',
    country: 'Kenya',
    languages: ['English', 'Swahili'],
    expertise_fields: ['Healthcare', 'Agriculture'],
    trust_score: 60,
    onboarding_completed: true
  },
  {
    email: 'team@example.com',
    password: 'dev123456',
    role: 'team_account',
    name: 'Team Account',
    country: 'South Africa',
    languages: [],
    expertise_fields: [],
    trust_score: null,
    onboarding_completed: false
  },
  {
    email: 'admin@example.com',
    password: 'dev123456',
    role: 'platform_admin',
    name: 'Platform Admin',
    country: 'South Africa',
    languages: [],
    expertise_fields: [],
    trust_score: null,
    onboarding_completed: false
  }
]

async function createDevUsers() {
  console.log('🚀 Creating development users...\n')

  for (const userData of devUsers) {
    try {
      console.log(`Creating ${userData.role}: ${userData.email}...`)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // Auto-confirm for dev users
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User ${userData.email} already exists, skipping...`)
          continue
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('No user returned from auth creation')
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          country: userData.country,
          languages: userData.languages,
          expertise_fields: userData.expertise_fields,
          trust_score: userData.trust_score,
          onboarding_completed: userData.onboarding_completed,
        })

      if (profileError) {
        // If profile already exists, try to update it
        if (profileError.code === '23505') {
          console.log(`  ⚠️  Profile already exists, updating...`)
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: userData.name,
              country: userData.country,
              languages: userData.languages,
              expertise_fields: userData.expertise_fields,
              trust_score: userData.trust_score,
              onboarding_completed: userData.onboarding_completed,
            })
            .eq('id', authData.user.id)

          if (updateError) throw updateError
        } else {
          throw profileError
        }
      }

      console.log(`  ✅ Created ${userData.role}: ${userData.email}`)
      console.log(`     Password: ${userData.password}`)
      console.log(`     Name: ${userData.name}`)
      if (userData.role === 'contributor') {
        console.log(`     Trust Score: ${userData.trust_score}`)
      }
      console.log('')

    } catch (error) {
      console.error(`  ❌ Error creating ${userData.email}:`, error.message)
      console.log('')
    }
  }

  console.log('✅ Development users setup complete!\n')
  console.log('📝 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Contributor Account:')
  console.log('  Email: contributor@example.com')
  console.log('  Password: dev123456')
  console.log('  Dashboard: http://localhost:3000/contributor/dashboard')
  console.log('')
  console.log('Client Owner Account:')
  console.log('  Email: client@example.com')
  console.log('  Password: dev123456')
  console.log('  Dashboard: http://localhost:3000/client/dashboard')
  console.log('')
  console.log('Additional Contributor:')
  console.log('  Email: contributor2@example.com')
  console.log('  Password: dev123456')
  console.log('')
  console.log('Team Account:')
  console.log('  Email: team@example.com')
  console.log('  Password: dev123456')
  console.log('  Dashboard: http://localhost:3000/team/dashboard')
  console.log('')
  console.log('Platform Admin Account:')
  console.log('  Email: admin@example.com')
  console.log('  Password: dev123456')
  console.log('  Dashboard: http://localhost:3001/dashboard (Admin Portal)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// Run the script
createDevUsers().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

