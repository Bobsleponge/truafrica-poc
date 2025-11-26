import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get users by country
    const { data: users } = await supabase
      .from('users')
      .select('country')

    const userDistribution = (users || []).reduce((acc, user) => {
      const country = user.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get campaigns by target countries
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('target_countries')

    const campaignDistribution = (campaigns || []).reduce((acc, campaign) => {
      const countries = campaign.target_countries || []
      countries.forEach((country: string) => {
        acc[country] = (acc[country] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      user_distribution: Object.entries(userDistribution).map(([country, count]) => ({
        country,
        count,
      })),
      campaign_distribution: Object.entries(campaignDistribution).map(([country, count]) => ({
        country,
        count,
      })),
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



