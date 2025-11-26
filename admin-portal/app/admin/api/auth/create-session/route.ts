import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth/session'
import { requirePlatformAdmin } from '@/lib/auth/rbac'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user is platform admin before creating session
    // This uses the service-role client to check role
    const supabase = await import('@/lib/supabase/server').then(m => m.createServerClient())
    
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    let role = user?.role
    if (!role) {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()
      role = adminProfile?.role
    }

    if (role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Access denied. Platform admin role required.' },
        { status: 403 }
      )
    }

    // Create session
    await createAdminSession(userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



