import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const { id: campaignId } = await params

    // Get campaign with pricing fields
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('total_budget, reward_budget, setup_fee, per_response_fee, validation_fee, analytics_fee, fine_tuning_fee')
      .eq('id', campaignId)
      .single()

    // Get pricing snapshots
    const { data: snapshots } = await supabase
      .from('campaign_pricing_snapshots')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get reward configuration if exists
    const { data: rewardConfig } = await supabase
      .from('reward_configurations')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    return NextResponse.json({
      pricing: {
        total_budget: campaign?.total_budget || 0,
        reward_budget: campaign?.reward_budget || 0,
        setup_fee: campaign?.setup_fee || 0,
        per_response_fee: campaign?.per_response_fee || 0,
        validation_fee: campaign?.validation_fee || 0,
        analytics_fee: campaign?.analytics_fee || 0,
        fine_tuning_fee: campaign?.fine_tuning_fee || 0,
      },
      snapshots: snapshots || [],
      reward_config: rewardConfig || null,
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



