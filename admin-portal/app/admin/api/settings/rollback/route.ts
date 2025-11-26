import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json(
        { error: 'versionId is required' },
        { status: 400 }
      )
    }

    // Get historical settings
    const { data: historyItem, error: historyError } = await supabase
      .from('platform_settings_history')
      .select('*')
      .eq('id', versionId)
      .single()

    if (historyError || !historyItem) {
      return NextResponse.json(
        { error: 'Settings version not found' },
        { status: 404 }
      )
    }

    // Update current settings
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert({
        ...historyItem,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      settings: data,
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



