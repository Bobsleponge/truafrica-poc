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

    // Get metrics
    const metricsResponse = await fetch(`${request.nextUrl.origin}/admin/api/analytics/metrics`)
    const metrics = await metricsResponse.json()

    if (format === 'csv') {
      const data = [
        { Metric: 'Total Users', Value: metrics.totalUsers },
        { Metric: 'Total Clients', Value: metrics.totalClients },
        { Metric: 'Total Campaigns', Value: metrics.totalCampaigns },
        { Metric: 'Active Campaigns', Value: metrics.activeCampaigns },
        { Metric: 'Total Contributors', Value: metrics.totalContributors },
      ]

      const csv = Papa.unparse(data, { header: true })
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json(metrics)
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



