/**
 * Run migration 006 SQL to add platform_admin to enum, then fix user role
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

async function runMigrationAndFixRole() {
  console.log('🔧 Running migration and fixing admin role...\n')

  try {
    // Step 1: Check if enum has platform_admin
    console.log('1. Checking enum values...')
    
    // We'll use the Supabase REST API directly to execute SQL
    // Since we can't execute DDL via PostgREST, we need to use the Management API
    // For now, let's try to update the role and see what happens
    
    // Step 2: Get admin user
    console.log('2. Getting admin user...')
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Error:', fetchError.message)
      process.exit(1)
    }

    if (!user) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log(`   Current role: ${user.role}`)

    if (user.role === 'platform_admin') {
      console.log('   ✅ Already has platform_admin role!')
      return
    }

    // Step 3: Try to update role
    console.log('3. Attempting to update role to platform_admin...')
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.message.includes('enum') || updateError.message.includes('invalid input')) {
        console.log(`   ❌ Enum doesn't have 'platform_admin' value yet`)
        console.log('')
        console.log('   📝 You need to run the migration SQL first.')
        console.log('   Go to: https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/sql/new')
        console.log('')
        console.log('   Copy and paste this SQL:')
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('   DO $$')
        console.log('   BEGIN')
        console.log('       IF NOT EXISTS (')
        console.log('           SELECT 1 FROM pg_enum')
        console.log('           WHERE enumlabel = \'platform_admin\'')
        console.log('           AND enumtypid = (SELECT oid FROM pg_type WHERE typname = \'user_role\')')
        console.log('       ) THEN')
        console.log('           ALTER TYPE user_role ADD VALUE \'platform_admin\';')
        console.log('       END IF;')
        console.log('   END $$;')
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('')
        console.log('   Then run this:')
        console.log('   UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
        console.log('')
        process.exit(1)
      } else {
        console.error(`   ❌ Error: ${updateError.message}`)
        process.exit(1)
      }
    }

    console.log(`   ✅ Role updated successfully!`)
    console.log(`   ✅ User: ${updated.email}`)
    console.log(`   ✅ Role: ${updated.role}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

runMigrationAndFixRole()



