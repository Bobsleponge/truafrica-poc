import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const industry = searchParams.get('industry')
    const offset = (page - 1) * limit

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (industry) {
      query = query.eq('industry', industry)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply search
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%,contact_phone.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get campaign counts for each client
    const clientIds = (data || []).map((c) => c.id)
    const { data: campaignCounts } = await supabase
      .from('campaigns')
      .select('client_id')
      .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])

    const countsMap = new Map<string, number>()
    campaignCounts?.forEach((campaign) => {
      countsMap.set(campaign.client_id, (countsMap.get(campaign.client_id) || 0) + 1)
    })

    const clientsWithCounts = (data || []).map((client) => ({
      ...client,
      campaign_count: countsMap.get(client.id) || 0,
    }))

    return NextResponse.json({
      clients: clientsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

