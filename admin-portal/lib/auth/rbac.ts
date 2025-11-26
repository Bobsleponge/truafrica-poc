import { redirect } from 'next/navigation'
import { getAdminSession } from './session'
import { createServerClient } from '../supabase/server'

export interface PlatformAdmin {
  id: string
  email: string
  role: 'platform_admin'
}

/**
 * Require platform admin authentication and role
 * Throws redirect if not authenticated or not platform_admin
 * Returns the admin user if valid
 */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const session = await getAdminSession()

  if (!session) {
    redirect('/login')
  }

  // Verify the user still exists and has platform_admin role
  const supabase = createServerClient()
  
  // Check if user exists in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(session.userId)
  
  if (authError || !authUser) {
    redirect('/login')
  }

  // Check role from admin_profiles table (or users table if that's where role is stored)
  // For now, we'll check a profiles or users table
  // Adjust table name based on your schema
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.userId)
    .single()

  // If users table doesn't have role, try admin_profiles
  let role = profile?.role
  if (!role && profileError) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('user_id', session.userId)
      .single()
    
    role = adminProfile?.role
  }

  if (role !== 'platform_admin') {
    redirect('/login')
  }

  return {
    id: session.userId,
    email: session.email,
    role: 'platform_admin',
  }
}

/**
 * Check if current user is platform admin (non-throwing version)
 * Returns null if not authenticated or not platform_admin
 */
export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  try {
    return await requirePlatformAdmin()
  } catch {
    return null
  }
}



