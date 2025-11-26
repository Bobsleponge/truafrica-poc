import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    // Build query
    let query = supabase
      .from('campaigns')
      .select(`
        id,
        name,
        description,
        status,
        company_name,
        industry,
        total_budget,
        reward_budget,
        created_at,
        updated_at,
        client:users!campaigns_client_id_fkey(email)
      `)

    if (status) {
      query = query.eq('status', status)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (format === 'csv') {
      const csv = Papa.unparse(data || [], {
        header: true,
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="campaigns-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({
      campaigns: data || [],
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



