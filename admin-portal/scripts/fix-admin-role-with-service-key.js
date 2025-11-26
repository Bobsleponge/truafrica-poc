/**
 * Fix admin role using service role key
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

async function fixAdminRole() {
  console.log('🔧 Fixing admin user role with service role key...\n')

  try {
    // First, check if platform_admin exists in enum
    // If not, we need to add it first
    console.log('1. Checking current admin user...')
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

    // Try to update role
    console.log('2. Updating role to platform_admin...')
    
    // First, ensure the enum has platform_admin value
    // We'll try a direct SQL update via RPC or direct query
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.log(`   ⚠️  Direct update failed: ${updateError.message}`)
      console.log('   Trying SQL approach...')
      
      // Try using rpc or direct SQL
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `UPDATE users SET role = 'platform_admin' WHERE id = '${user.id}'::uuid;`
      }).catch(() => ({ data: null, error: { message: 'RPC not available' } }))

      if (sqlError) {
        console.log('   ⚠️  SQL approach not available')
        console.log('')
        console.log('   📝 Please run this SQL in Supabase SQL Editor:')
        console.log(`   UPDATE users SET role = 'platform_admin' WHERE email = 'admin@example.com';`)
        console.log('')
        console.log('   Or check if the enum needs to be updated first:')
        console.log('   ALTER TYPE user_role ADD VALUE IF NOT EXISTS \'platform_admin\';')
        process.exit(1)
      }
    } else {
      console.log(`   ✅ Role updated successfully!`)
      console.log(`   ✅ User: ${updated.email}`)
      console.log(`   ✅ Role: ${updated.role}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixAdminRole()



