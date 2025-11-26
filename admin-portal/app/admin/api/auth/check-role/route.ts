import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if user exists
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

    if (authError || !authUser) {
      return NextResponse.json(
        { isPlatformAdmin: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check role from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    // If not in users table, check admin_profiles
    let role = user?.role
    if (!role && userError) {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()

      role = adminProfile?.role
    }

    const isPlatformAdmin = role === 'platform_admin'

    return NextResponse.json({
      isPlatformAdmin,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        role: role || null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



