import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent campaigns
    const { data: recentCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Get recent users
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, created_at, role')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Get recent clients
    const { data: recentClients } = await supabase
      .from('clients')
      .select('id, name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Combine and sort by date
    const activities = [
      ...(recentCampaigns || []).map((c) => ({
        type: 'campaign',
        id: c.id,
        name: c.name,
        timestamp: c.created_at,
        status: c.status,
      })),
      ...(recentUsers || []).map((u) => ({
        type: 'user',
        id: u.id,
        name: u.email,
        timestamp: u.created_at,
        role: u.role,
      })),
      ...(recentClients || []).map((c) => ({
        type: 'client',
        id: c.id,
        name: c.name,
        timestamp: c.created_at,
        status: c.status,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities,
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



