import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const { id: clientId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'client' // client, campaigns

    if (type === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (format === 'csv') {
        const csv = Papa.unparse([client || {}], { header: true })
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="client-${clientId}.csv"`,
          },
        })
      }
    } else if (type === 'campaigns') {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)

      if (format === 'csv') {
        const csv = Papa.unparse(campaigns || [], { header: true })
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="client-${clientId}-campaigns.csv"`,
          },
        })
      }
    }

    return NextResponse.json({ error: 'Invalid type or format' }, { status: 400 })
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



