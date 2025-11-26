/**
 * Script to fix admin user role to platform_admin
 * Uses anon key (no service role needed)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gcixmuhaybldhfaqnvaa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaXhtdWhheWJsZGhmYXFudmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDk5MjEsImV4cCI6MjA3ODk4NTkyMX0.PiLLDhLFaWyJN9cnUP8f8TTgcyGwxfezw5Pv6EWdF5M'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixAdminRole() {
  console.log('🔧 Fixing admin user role...\n')

  try {
    // Check current role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message)
      process.exit(1)
    }

    if (!user) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log(`Current role: ${user.role}`)

    if (user.role === 'platform_admin') {
      console.log('✅ User already has platform_admin role')
      return
    }

    // Try to update - this might fail with anon key due to RLS
    // But we'll try anyway
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: 'platform_admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.log('⚠️  Cannot update with anon key (RLS restriction)')
      console.log('📝 You need to update manually in Supabase:')
      console.log('')
      console.log('   Option 1: Use Supabase SQL Editor:')
      console.log('   UPDATE users SET role = \'platform_admin\' WHERE email = \'admin@example.com\';')
      console.log('')
      console.log('   Option 2: Use service role key in .env.local and run:')
      console.log('   node scripts/create-platform-admin.js')
      console.log('')
      process.exit(1)
    }

    console.log('✅ Role updated to platform_admin')
    console.log(`   User: ${updated.email}`)
    console.log(`   Role: ${updated.role}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixAdminRole()



