import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { AdminQuestion } from '@/types/admin'

/**
 * GET /api/admin/questions
 * Get all questions with status and metrics
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const difficulty = searchParams.get('difficulty')
      const campaignId = searchParams.get('campaign_id')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = (page - 1) * limit

      const supabase = await createClient()

      // Get questions with client info
      let query = supabase
        .from('questions')
        .select(`
          *,
          users!questions_client_id_fkey (
            id,
            name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }
      if (difficulty) {
        query = query.eq('difficulty_level', difficulty)
      }

      query = query.range(offset, offset + limit - 1)

      const { data: questions, error, count } = await query

      if (error) throw error

      // Get campaign info for questions
      const questionIds = (questions || []).map(q => q.id)
      const { data: campaignQuestions } = await supabase
        .from('campaign_questions')
        .select('question_id, campaign_id, campaigns!inner(id, name)')
        .in('question_id', questionIds)

      // Get answer counts and averages
      const { data: answers } = await supabase
        .from('answers')
        .select('question_id, consensus_score, validation_confidence_score')
        .in('question_id', questionIds)

      // Calculate metrics per question
      const questionMetrics: Record<string, {
        count: number
        avgConsensus: number | null
        avgValidation: number | null
      }> = {}

      answers?.forEach(answer => {
        if (!questionMetrics[answer.question_id]) {
          questionMetrics[answer.question_id] = {
            count: 0,
            avgConsensus: null,
            avgValidation: null,
          }
        }
        questionMetrics[answer.question_id].count++
      })

      // Calculate averages
      Object.keys(questionMetrics).forEach(qId => {
        const qAnswers = answers?.filter(a => a.question_id === qId) || []
        const consensusScores = qAnswers.map(a => a.consensus_score).filter(Boolean) as number[]
        const validationScores = qAnswers.map(a => a.validation_confidence_score).filter(Boolean) as number[]

        questionMetrics[qId].avgConsensus = consensusScores.length > 0
          ? consensusScores.reduce((a, b) => a + b, 0) / consensusScores.length
          : null
        questionMetrics[qId].avgValidation = validationScores.length > 0
          ? validationScores.reduce((a, b) => a + b, 0) / validationScores.length
          : null
      })

      const adminQuestions: AdminQuestion[] = (questions || []).map(question => {
        const company = Array.isArray(question.users) ? question.users[0] : question.users
        const campaignQ = campaignQuestions?.find(cq => cq.question_id === question.id)
        const metrics = questionMetrics[question.id] || { count: 0, avgConsensus: null, avgValidation: null }

        return {
          id: question.id,
          content: question.content,
          difficulty_level: question.difficulty_level,
          status: question.status,
          client_id: question.client_id || question.company_id, // Support both for migration
          client_name: company?.name || company?.email || 'Unknown',
          company_id: question.company_id, // Legacy support
          company_name: company?.name || company?.email || 'Unknown', // Legacy support
          campaign_id: campaignQ?.campaign_id || null,
          campaign_name: campaignQ?.campaigns ? (Array.isArray(campaignQ.campaigns) ? campaignQ.campaigns[0]?.name : campaignQ.campaigns?.name) : null,
          answer_count: metrics.count,
          average_consensus: metrics.avgConsensus,
          average_validation_confidence: metrics.avgValidation,
          created_at: question.created_at,
          updated_at: question.updated_at,
        }
      })

      // Filter by campaign_id if provided
      const filteredQuestions = campaignId
        ? adminQuestions.filter(q => q.campaign_id === campaignId)
        : adminQuestions

      return NextResponse.json({
        success: true,
        questions: filteredQuestions,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: error.message },
        { status: 500 }
      )
    }
  })
}

