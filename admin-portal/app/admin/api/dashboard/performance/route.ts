import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get time series data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // User growth
    const { data: usersData } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Campaign activity
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Aggregate time series data
    const aggregateByDate = (data: any[], dateField: string) => {
      const grouped = new Map<string, number>()
      data.forEach((item) => {
        const date = new Date(item[dateField]).toISOString().split('T')[0]
        grouped.set(date, (grouped.get(date) || 0) + 1)
      })
      return Array.from(grouped.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const userGrowth = aggregateByDate(usersData || [], 'created_at')
    const campaignActivity = aggregateByDate(campaignsData || [], 'created_at')

    return NextResponse.json({
      userGrowth,
      campaignActivity,
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



