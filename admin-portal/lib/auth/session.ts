import { cookies } from 'next/headers'
import { createServerClient } from '../supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface AdminSession {
  userId: string
  email: string
  role: string
}

/**
 * Create an admin session cookie after successful login
 */
export async function createAdminSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createServerClient()
  
  // Fetch user details to store in session
  const { data: user, error } = await supabase.auth.admin.getUserById(userId)
  
  if (error || !user) {
    throw new Error('Failed to fetch user for session')
  }

  const sessionData: AdminSession = {
    userId: user.user.id,
    email: user.user.email || '',
    role: 'platform_admin', // Only platform_admin can create sessions
  }

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Get the current admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    try {
      const session: AdminSession = JSON.parse(sessionCookie.value)
      return session
    } catch {
      return null
    }
  } catch {
    // cookies() can throw in some contexts, return null
    return null
  }
}

/**
 * Destroy the admin session cookie
 */
export async function destroyAdminSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch {
    // cookies() can throw in some contexts, ignore
  }
}

