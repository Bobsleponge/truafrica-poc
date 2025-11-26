import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/middleware/apiAuth'

/**
 * Check if the current request is authenticated as admin
 * Supports both session-based and API key authentication
 */
export async function requireAdmin(request: NextRequest): Promise<{
  isAdmin: boolean
  userId?: string
  error?: string
}> {
  // First try API key authentication
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7)
    const validation = await validateApiKey(request)
    
    if (validation.isValid && validation.clientId) {
      // Check if the API key belongs to an admin user
      const supabase = await createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', validation.clientId)
        .single()

      if (userData?.role === 'admin' || userData?.role === 'team_account') {
        return {
          isAdmin: true,
          userId: validation.clientId,
        }
      }
    }
  }

  // Fall back to session-based authentication
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      isAdmin: false,
      error: 'Unauthorized - Please log in to continue',
    }
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Allow admin and team_account roles
  if (userError || (userData?.role !== 'admin' && userData?.role !== 'team_account')) {
    return {
      isAdmin: false,
      error: 'Forbidden - Administrator or team account access required',
    }
  }

  return {
    isAdmin: true,
    userId: user.id,
  }
}

/**
 * Middleware wrapper for admin-only endpoints
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await requireAdmin(request)

  if (!auth.isAdmin || !auth.userId) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.error?.includes('Forbidden') ? 403 : 401 }
    )
  }

  return handler(request, auth.userId)
}

/**
 * Client-side helper to ensure user is admin or redirect
 * Throws an error that should be caught by error boundary or handled by caller
 */
export async function ensureAdminOrThrow(): Promise<{ userId: string }> {
  if (typeof window === 'undefined') {
    throw new Error('ensureAdminOrThrow can only be used on the client side')
  }

  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Allow admin and team_account roles
  if (userError || (userData?.role !== 'admin' && userData?.role !== 'team_account')) {
    throw new Error('FORBIDDEN')
  }

  return { userId: user.id }
}

/**
 * Redirect to 403 page
 */
export function redirectToForbidden(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/403'
  }
}

