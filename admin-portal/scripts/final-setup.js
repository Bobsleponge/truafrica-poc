/**
 * Final setup - attempts to fix admin role using SQL via Supabase REST API
 * This uses the anon key to execute SQL (if RPC function exists)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gcixmuhaybldhfaqnvaa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function finalSetup() {
  console.log('🔧 Final Setup - Fixing Admin Role...\n')

  // Try to update using RPC function if it exists
  try {
    console.log('Attempting to update admin role...')
    
    // First, check current role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle()

    if (fetchError) {
      console.log(`   ❌ Error: ${fetchError.message}`)
      return
    }

    if (!user) {
      console.log('   ❌ Admin user not found')
      return
    }

    console.log(`   Current role: ${user.role}`)

    if (user.role === 'platform_admin') {
      console.log('   ✅ Admin user already has platform_admin role!')
      return
    }

    // Try direct update (will likely fail due to RLS)
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.log(`   ⚠️  Cannot update directly: ${updateError.message}`)
      console.log('')
      console.log('   📝 Manual fix required:')
      console.log('   1. Go to: https://supabase.com/dashboard/project/gcixmuhaybldhfaqnvaa/sql/new')
      console.log('   2. Run this SQL:')
      console.log('')
      console.log('      UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
      console.log('')
      console.log('   3. Click "Run"')
      return
    }

    console.log(`   ✅ Role updated successfully!`)
    console.log(`   ✅ User: ${updated.email}, Role: ${updated.role}`)

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }
}

finalSetup()



