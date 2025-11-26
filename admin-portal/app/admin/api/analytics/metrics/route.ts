import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get basic counts
    const [usersResult, clientsResult, campaignsResult, activeCampaignsResult, contributorsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'contributor'),
    ])

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let start: Date
    let end: Date = new Date()
    
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      start = new Date()
      start.setDate(start.getDate() - days)
    }

    // User growth
    const { data: usersData } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    // Campaign activity
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('created_at, status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    // Aggregate time series data
    const userGrowth = aggregateByDate(usersData || [], 'created_at')
    const campaignActivity = aggregateByDate(campaignsData || [], 'created_at')

    // Mock reward distribution (adjust based on your schema)
    const rewardDistribution = userGrowth.map(item => ({
      ...item,
      value: Math.floor(Math.random() * 1000), // Replace with actual reward data
    }))

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      totalClients: clientsResult.count || 0,
      totalCampaigns: campaignsResult.count || 0,
      activeCampaigns: activeCampaignsResult.count || 0,
      totalContributors: contributorsResult.count || 0,
      userGrowth,
      campaignActivity,
      rewardDistribution,
      contributorParticipation: userGrowth, // Placeholder
      clientEngagement: userGrowth, // Placeholder
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

function aggregateByDate(data: any[], dateField: string) {
  const grouped = new Map<string, number>()
  
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0]
    grouped.set(date, (grouped.get(date) || 0) + 1)
  })

  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

