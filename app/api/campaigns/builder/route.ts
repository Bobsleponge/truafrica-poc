import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStepIndex } from '@/store/useCampaignBuilderStore'
import type { CampaignJourneyStepKey } from '@/types/campaign-journey'

/**
 * POST /api/campaigns/builder
 * Save wizard state
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, step, data } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    // Convert step key to integer (database expects 1-based index)
    const stepInteger = typeof step === 'string' 
      ? getStepIndex(step as CampaignJourneyStepKey) + 1
      : typeof step === 'number'
      ? step
      : 1

    // Check if we need to sync the name field from wizard_data
    const updateData: any = {
      wizard_data: data,
      wizard_step: stepInteger,
      updated_at: new Date().toISOString(),
    }

    // Sync name from wizard_data.overview.campaignName if it exists and differs
    if (data?.overview?.campaignName) {
      const wizardName = data.overview.campaignName
      // Get current campaign to check existing name
      const { data: currentCampaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single()

      // Update name if it's "Untitled Campaign" or empty, or if wizard name differs
      if (
        !currentCampaign?.name ||
        currentCampaign.name === 'Untitled Campaign' ||
        currentCampaign.name !== wizardName
      ) {
        updateData.name = wizardName
      }
    }

    // Update campaign with wizard data
    const { error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save wizard state' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns/builder
 * Load wizard state
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('wizard_data, wizard_step')
      .eq('id', campaignId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: campaign.wizard_data,
      step: campaign.wizard_step,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load wizard state' },
      { status: 500 }
    )
  }
}

