import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const userIds = searchParams.get('ids')?.split(',')

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .in('id', userIds)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
    })
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



