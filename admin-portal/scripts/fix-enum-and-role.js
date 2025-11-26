/**
 * Fix enum and admin role using service role key
 * First adds platform_admin to enum, then updates user
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

async function fixEnumAndRole() {
  console.log('🔧 Fixing enum and admin role...\n')

  try {
    // Step 1: Add platform_admin to enum if it doesn't exist
    console.log('1. Adding platform_admin to user_role enum...')
    
    // Use REST API to execute SQL
    const addEnumSQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'platform_admin' 
              AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
          ) THEN
              ALTER TYPE user_role ADD VALUE 'platform_admin';
          END IF;
      END $$;
    `

    // Execute via REST API using service role
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: addEnumSQL })
    }).catch(() => null)

    if (!response || !response.ok) {
      // Try alternative: direct SQL execution via PostgREST
      console.log('   ⚠️  Using alternative method...')
      
      // Actually, we need to use the Supabase Management API or SQL editor
      // For now, let's try updating the role directly and see what happens
      // If it fails, we'll provide SQL instructions
    } else {
      console.log('   ✅ Enum value added (or already exists)')
    }

    // Step 2: Update user role
    console.log('2. Updating admin user role...')
    
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle()

    if (!user) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log(`   Current role: ${user.role}`)

    if (user.role === 'platform_admin') {
      console.log('   ✅ Already has platform_admin role!')
      return
    }

    // Try to update - this will fail if enum doesn't have the value
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`)
      console.log('')
      console.log('   📝 The enum needs to be updated first.')
      console.log('   Please run this SQL in Supabase SQL Editor:')
      console.log('')
      console.log('   -- Add enum value (if not exists)')
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
      console.log('')
      console.log('   -- Then update user')
      console.log('   UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
      console.log('')
      process.exit(1)
    }

    console.log(`   ✅ Role updated successfully!`)
    console.log(`   ✅ User: ${updated.email}`)
    console.log(`   ✅ Role: ${updated.role}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixEnumAndRole()



