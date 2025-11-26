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
    const { id: userId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'user' // user, activity

    if (type === 'user') {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (format === 'csv') {
        const csv = Papa.unparse([user || {}], { header: true })
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="user-${userId}.csv"`,
          },
        })
      }
    } else if (type === 'activity') {
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('contributor_id', userId)

      if (format === 'csv') {
        const csv = Papa.unparse(answers || [], { header: true })
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="user-${userId}-activity.csv"`,
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



