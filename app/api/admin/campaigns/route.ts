import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { AdminCampaign } from '@/types/admin'

/**
 * GET /api/admin/campaigns
 * Get all campaigns with detailed metrics
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = (page - 1) * limit

      const supabase = await createClient()

      // Get campaigns with client info
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          users!campaigns_client_id_fkey (
            id,
            name,
            email
          ),
          campaign_questions (
            id,
            question_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      query = query.range(offset, offset + limit - 1)

      const { data: campaigns, error, count } = await query

      if (error) throw error

      // Get answer counts for each campaign
      const campaignIds = (campaigns || []).map(c => c.id)
      const { data: campaignQuestions } = await supabase
        .from('campaign_questions')
        .select('campaign_id, question_id')
        .in('campaign_id', campaignIds)

      const questionIds = (campaignQuestions || []).map(cq => cq.question_id)
      
      let answerCounts: Record<string, number> = {}
      let requiredResponses: Record<string, number> = {}

      if (questionIds.length > 0) {
        const { data: answers } = await supabase
          .from('answers')
          .select('question_id')
          .in('question_id', questionIds)

        // Count answers per campaign
        campaignQuestions?.forEach(cq => {
          const answerCount = answers?.filter(a => a.question_id === cq.question_id).length || 0
          answerCounts[cq.campaign_id] = (answerCounts[cq.campaign_id] || 0) + answerCount
        })

        // Get required responses from campaign_questions
        const { data: cqData } = await supabase
          .from('campaign_questions')
          .select('campaign_id, required_responses')
          .in('campaign_id', campaignIds)

        cqData?.forEach(cq => {
          requiredResponses[cq.campaign_id] = (requiredResponses[cq.campaign_id] || 0) + (cq.required_responses || 10)
        })
      }

      const adminCampaigns: AdminCampaign[] = (campaigns || []).map(campaign => {
        const client = Array.isArray(campaign.users) ? campaign.users[0] : campaign.users
        const totalQuestions = campaignQuestions?.filter(cq => cq.campaign_id === campaign.id).length || 0
        const totalResponses = answerCounts[campaign.id] || 0
        const required = requiredResponses[campaign.id] || totalQuestions * 10

        return {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          client_id: campaign.client_id,
          client_name: client?.name || client?.email || 'Unknown',
          total_questions: totalQuestions,
          total_responses: totalResponses,
          required_responses: required,
          completion_rate: required > 0 ? (totalResponses / required) * 100 : 0,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at,
        }
      })

      return NextResponse.json({
        success: true,
        campaigns: adminCampaigns,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns', details: error.message },
        { status: 500 }
      )
    }
  })
}



