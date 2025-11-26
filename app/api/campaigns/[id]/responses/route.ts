import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/middleware/apiAuth'

/**
 * GET /api/campaigns/:id/responses
 * Get paginated campaign responses (API endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, clientId, apiKeyId) => {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per page
    const offset = (page - 1) * limit

    // Import here to avoid circular dependency
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const campaignId = params.id

    // Verify campaign belongs to client
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, client_id')
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

    // Get question IDs for this campaign
    const { data: campaignQuestions } = await supabase
      .from('campaign_questions')
      .select('question_id')
      .eq('campaign_id', campaignId)

    const questionIds = (campaignQuestions || []).map((cq: any) => cq.question_id)

    if (questionIds.length === 0) {
      return NextResponse.json({
        success: true,
        responses: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Get total count
    const { count } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .in('question_id', questionIds)

    // Get paginated responses
    const { data: responses, error } = await supabase
      .from('answers')
      .select(`
        id,
        answer_text,
        consensus_score,
        validation_confidence_score,
        correct,
        created_at,
        questions:question_id (
          id,
          content
        ),
        users:contributor_id (
          id,
          name,
          trust_score
        )
      `)
      .in('question_id', questionIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      responses: responses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  })
}




