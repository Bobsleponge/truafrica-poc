import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPricingBreakdownFromJourney } from '@/lib/campaign/pricingService'
import type { CampaignJourneyData } from '@/types/campaign-journey'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const campaign = body.campaign as CampaignJourneyData

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign data required' }, { status: 400 })
    }

    const breakdown = await getPricingBreakdownFromJourney(campaign)

    return NextResponse.json({ success: true, breakdown })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}



