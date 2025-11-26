import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { AdminAnswer } from '@/types/admin'

/**
 * GET /api/admin/answers
 * Get all answers with validation scores
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const questionId = searchParams.get('question_id')
      const contributorId = searchParams.get('contributor_id')
      const flagged = searchParams.get('flagged')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = (page - 1) * limit

      const supabase = await createClient()

      // Get answers with question and contributor info
      let query = supabase
        .from('answers')
        .select(`
          *,
          questions!inner (
            id,
            content
          ),
          users!answers_contributor_id_fkey (
            id,
            name,
            email,
            trust_score
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (questionId) {
        query = query.eq('question_id', questionId)
      }
      if (contributorId) {
        query = query.eq('contributor_id', contributorId)
      }

      query = query.range(offset, offset + limit - 1)

      const { data: answers, error, count } = await query

      if (error) throw error

      // Get flagged answers info
      const answerIds = (answers || []).map(a => a.id)
      const { data: flaggedAnswers } = await supabase
        .from('flagged_answers')
        .select('answer_id, reason, status')
        .in('answer_id', answerIds)

      const flaggedMap = new Map(
        (flaggedAnswers || []).map(fa => [fa.answer_id, { reason: fa.reason, status: fa.status }])
      )

      const adminAnswers: AdminAnswer[] = (answers || []).map(answer => {
        const question = Array.isArray(answer.questions) ? answer.questions[0] : answer.questions
        const contributor = Array.isArray(answer.users) ? answer.users[0] : answer.users
        const flagged = flaggedMap.get(answer.id)

        return {
          id: answer.id,
          answer_text: answer.answer_text,
          question_id: answer.question_id,
          question_content: question?.content || 'Unknown',
          contributor_id: answer.contributor_id,
          contributor_name: contributor?.name || contributor?.email || 'Unknown',
          contributor_trust_score: contributor?.trust_score || 0,
          consensus_score: answer.consensus_score,
          validation_confidence_score: answer.validation_confidence_score,
          correct: answer.correct,
          is_flagged: !!flagged,
          flagged_reason: flagged?.reason || null,
          created_at: answer.created_at,
        }
      })

      // Filter by flagged status if provided
      const filteredAnswers = flagged === 'true'
        ? adminAnswers.filter(a => a.is_flagged)
        : flagged === 'false'
        ? adminAnswers.filter(a => !a.is_flagged)
        : adminAnswers

      return NextResponse.json({
        success: true,
        answers: filteredAnswers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Error fetching answers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch answers', details: error.message },
        { status: 500 }
      )
    }
  })
}



