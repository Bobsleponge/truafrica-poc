import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const body = await request.json()
    const { name, contact_email, contact_phone, status = 'active', ...otherFields } = body

    if (!name || !contact_email) {
      return NextResponse.json(
        { error: 'name and contact_email are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name,
        contact_email,
        contact_phone,
        status,
        ...otherFields,
        created_at: new Date().toISOString(),
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
      client: data,
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



