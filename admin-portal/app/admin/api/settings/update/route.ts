import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const settings = await request.json()

    // Check if settings record exists
    const { data: existing } = await supabase
      .from('platform_settings')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('platform_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: admin.id,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('platform_settings')
        .insert({
          ...settings,
          updated_by: admin.id,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({ settings: result })
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



