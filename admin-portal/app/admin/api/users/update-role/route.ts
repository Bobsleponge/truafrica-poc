import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['platform_admin', 'client', 'team', 'contributor']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      // Try updating admin_profiles if users table doesn't have role
      const { data: adminProfile, error: adminError } = await supabase
        .from('admin_profiles')
        .update({ role })
        .eq('user_id', userId)
        .select()
        .single()

      if (adminError) {
        return NextResponse.json(
          { error: error.message || adminError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ user: adminProfile })
    }

    return NextResponse.json({ user: data })
  } catch (error: any) {
    if (error.message === 'redirect') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



