/**
 * Complete setup script - fixes admin role and creates .env.local
 * Uses service role key from main app if available
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Try to load from main app .env.local
function loadMainAppEnv() {
  const mainEnvPath = path.join(process.cwd(), '..', '.env.local')
  if (fs.existsSync(mainEnvPath)) {
    const envFile = fs.readFileSync(mainEnvPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (key === 'SUPABASE_SERVICE_ROLE_KEY' && value && !value.includes('YOUR')) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = value
        }
      }
    })
  }
}

loadMainAppEnv()

const supabaseUrl = 'https://gcixmuhaybldhfaqnvaa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function completeSetup() {
  console.log('🚀 Completing Admin Portal Setup...\n')

  // Step 1: Create .env.local
  console.log('1️⃣  Creating .env.local file...')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://gcixmuhaybldhfaqnvaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey || 'YOUR_SERVICE_ROLE_KEY_HERE'}
NODE_ENV=development
`

  if (fs.existsSync(envLocalPath)) {
    console.log('   ⚠️  .env.local already exists, checking if service role key is set...')
    const existing = fs.readFileSync(envLocalPath, 'utf8')
    if (existing.includes('SUPABASE_SERVICE_ROLE_KEY') && !existing.includes('YOUR_SERVICE_ROLE_KEY_HERE')) {
      console.log('   ✅ .env.local exists with service role key')
    } else {
      console.log('   ⚠️  .env.local exists but service role key needs to be added')
      console.log('   📝 Please add SUPABASE_SERVICE_ROLE_KEY manually')
    }
  } else {
    try {
      fs.writeFileSync(envLocalPath, envContent)
      if (supabaseServiceKey && !supabaseServiceKey.includes('YOUR')) {
        console.log('   ✅ .env.local created with service role key from main app')
      } else {
        console.log('   ✅ .env.local created (service role key needs to be added manually)')
        console.log('   📝 Get it from: Supabase Dashboard > Settings > API > service_role key')
      }
    } catch (error) {
      console.log(`   ❌ Error creating .env.local: ${error.message}`)
      console.log('   📝 Please create it manually')
    }
  }

  console.log('')

  // Step 2: Fix admin user role
  if (supabaseServiceKey && !supabaseServiceKey.includes('YOUR')) {
    console.log('2️⃣  Fixing admin user role...')
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Check current role
      const { data: user } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'admin@example.com')
        .maybeSingle()

      if (user) {
        if (user.role === 'platform_admin') {
          console.log('   ✅ Admin user already has platform_admin role')
        } else {
          console.log(`   🔧 Updating role from "${user.role}" to "platform_admin"...`)
          const { data: updated, error } = await supabase
            .from('users')
            .update({ role: 'platform_admin' })
            .eq('id', user.id)
            .select()
            .single()

          if (error) {
            console.log(`   ❌ Error updating role: ${error.message}`)
          } else {
            console.log(`   ✅ Role updated successfully`)
            console.log(`   ✅ User: ${updated.email}, Role: ${updated.role}`)
          }
        }
      } else {
        console.log('   ⚠️  Admin user not found')
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  } else {
    console.log('2️⃣  Fixing admin user role...')
    console.log('   ⏭️  Skipping (service role key not available)')
    console.log('   📝 Fix manually in Supabase SQL Editor:')
    console.log('      UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
  }

  console.log('')

  // Step 3: Verify setup
  console.log('3️⃣  Verifying setup...')
  const hasEnv = fs.existsSync(envLocalPath)
  const envContentCheck = hasEnv ? fs.readFileSync(envLocalPath, 'utf8') : ''
  const hasServiceKey = envContentCheck.includes('SUPABASE_SERVICE_ROLE_KEY') && 
                       !envContentCheck.includes('YOUR_SERVICE_ROLE_KEY_HERE')

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Setup Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (hasEnv && hasServiceKey) {
    console.log('✅ .env.local: Created and configured')
  } else if (hasEnv) {
    console.log('⚠️  .env.local: Created but needs SUPABASE_SERVICE_ROLE_KEY')
  } else {
    console.log('❌ .env.local: Not created')
  }

  if (supabaseServiceKey && !supabaseServiceKey.includes('YOUR')) {
    console.log('✅ Service role key: Available')
  } else {
    console.log('⚠️  Service role key: Needs to be added to .env.local')
  }

  console.log('')
  
  if (hasEnv && hasServiceKey) {
    console.log('🎉 Setup complete! You can now:')
    console.log('   1. Start server: npm run dev')
    console.log('   2. Visit: http://localhost:3001/login-button')
    console.log('   3. Login: admin@example.com / dev123456')
  } else {
    console.log('⚠️  Almost there! Remaining steps:')
    if (!hasServiceKey) {
      console.log('   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local')
      console.log('      Get it from: Supabase Dashboard > Settings > API')
    }
    if (!hasEnv) {
      console.log('   1. Create .env.local file')
    }
    console.log('   2. Fix admin role in Supabase SQL Editor if needed')
    console.log('   3. Start server: npm run dev')
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

completeSetup().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})



