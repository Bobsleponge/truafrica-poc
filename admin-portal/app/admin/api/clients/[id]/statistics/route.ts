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
    const { id: clientId } = await params

    // Get all campaigns for this client
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, status, total_budget, reward_budget, created_at')
      .eq('client_id', clientId)

    const totalCampaigns = campaigns?.length || 0
    const activeCampaigns = campaigns?.filter((c) => c.status === 'running' || c.status === 'active').length || 0
    const totalSpend = campaigns?.reduce((sum, c) => sum + Number(c.total_budget || 0), 0) || 0
    const totalRewardBudget = campaigns?.reduce((sum, c) => sum + Number(c.reward_budget || 0), 0) || 0

    // Get total responses (answers) for all campaigns
    const campaignIds = campaigns?.map((c) => c.id) || []
    let totalResponses = 0
    let contributorCount = 0

    if (campaignIds.length > 0) {
      // Get campaign questions
      const { data: campaignQuestions } = await supabase
        .from('campaign_questions')
        .select('question_id')
        .in('campaign_id', campaignIds)

      const questionIds = campaignQuestions?.map((cq) => cq.question_id) || []

      if (questionIds.length > 0) {
        // Get answers
        const { data: answers } = await supabase
          .from('answers')
          .select('contributor_id')
          .in('question_id', questionIds)

        totalResponses = answers?.length || 0
        contributorCount = new Set(answers?.map((a) => a.contributor_id) || []).size
      }
    }

    return NextResponse.json({
      statistics: {
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_spend: totalSpend,
        total_reward_budget: totalRewardBudget,
        total_responses: totalResponses,
        contributor_engagement: contributorCount,
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



