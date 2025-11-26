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

    // Get campaign questions with question details
    const { data, error } = await supabase
      .from('campaign_questions')
      .select(`
        *,
        question:questions(id, content, difficulty_level, status, created_at)
      `)
      .eq('campaign_id', campaignId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get answer counts for each question
    const questionIds = data?.map((cq) => cq.question_id) || []
    let answerCounts: Record<string, number> = {}
    
    if (questionIds.length > 0) {
      const { data: answers } = await supabase
        .from('answers')
        .select('question_id')
        .in('question_id', questionIds)

      answerCounts = (answers || []).reduce((acc, answer) => {
        acc[answer.question_id] = (acc[answer.question_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    const questionsWithCounts = (data || []).map((cq) => ({
      ...cq,
      answer_count: answerCounts[cq.question_id] || 0,
    }))

    return NextResponse.json({
      questions: questionsWithCounts,
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



