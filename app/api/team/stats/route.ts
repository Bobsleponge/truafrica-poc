import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/team/stats
 * Get global statistics (team account access)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is team account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'team_account') {
      return NextResponse.json(
        { error: 'Forbidden - Team account access required' },
        { status: 403 }
      )
    }

    // Get global stats
    const [clientsCount, campaignsCount, runningCampaignsCount, usersCount] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'running'),
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['client_owner', 'client_user', 'contributor']),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalClients: clientsCount.count || 0,
        totalCampaigns: campaignsCount.count || 0,
        runningCampaigns: runningCampaignsCount.count || 0,
        activeUsers: usersCount.count || 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



