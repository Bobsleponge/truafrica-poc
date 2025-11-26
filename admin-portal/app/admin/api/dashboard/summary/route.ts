import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get aggregated counts
    const [usersResult, clientsResult, campaignsResult, activeCampaignsResult, contributorsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).in('status', ['running', 'active']),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'contributor'),
    ])

    return NextResponse.json({
      summary: {
        totalUsers: usersResult.count || 0,
        totalClients: clientsResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
        activeCampaigns: activeCampaignsResult.count || 0,
        totalContributors: contributorsResult.count || 0,
      },
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



