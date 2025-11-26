import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/middleware/apiAuth'

/**
 * GET /api/campaigns/:id/summary
 * Get campaign summary statistics (API endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, clientId, apiKeyId) => {
    // Import here to avoid circular dependency
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const campaignId = params.id

    // Verify campaign belongs to client
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, client_id, name, status')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.client_id !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - Campaign does not belong to your account' },
        { status: 403 }
      )
    }

    // Get question IDs
    const { data: campaignQuestions } = await supabase
      .from('campaign_questions')
      .select('question_id, required_responses')
      .eq('campaign_id', campaignId)

    const questionIds = (campaignQuestions || []).map((cq: any) => cq.question_id)
    const requiredResponses = (campaignQuestions || []).reduce(
      (sum: number, cq: any) => sum + (cq.required_responses || 0),
      0
    )

    // Get answer count
    const { count: totalResponses } = questionIds.length > 0
      ? await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .in('question_id', questionIds)
      : { count: 0 }

    // Get pricing snapshot
    const { data: pricing } = await supabase
      .from('campaign_pricing_snapshots')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate average consensus
    const { data: answers } = questionIds.length > 0
      ? await supabase
          .from('answers')
          .select('consensus_score')
          .in('question_id', questionIds)
          .not('consensus_score', 'is', null)
      : { data: [] }

    const consensusScores = (answers || []).map((a: any) => Number(a.consensus_score))
    const averageConsensus =
      consensusScores.length > 0
        ? consensusScores.reduce((a, b) => a + b, 0) / consensusScores.length
        : 0

    return NextResponse.json({
      success: true,
      summary: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        totalQuestions: questionIds.length,
        totalResponses: totalResponses || 0,
        requiredResponses,
        completionRate: requiredResponses > 0 ? ((totalResponses || 0) / requiredResponses) * 100 : 0,
        averageConsensus,
        totalCost: pricing ? Number(pricing.estimated_total_cost) : 0,
      },
    })
  })
}


