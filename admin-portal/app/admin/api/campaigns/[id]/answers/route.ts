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
    const searchParams = request.nextUrl.searchParams
    const questionId = searchParams.get('questionId')

    // First, get all question IDs for this campaign
    const { data: campaignQuestions } = await supabase
      .from('campaign_questions')
      .select('question_id')
      .eq('campaign_id', campaignId)

    const questionIds = campaignQuestions?.map((cq) => cq.question_id) || []

    if (questionIds.length === 0) {
      return NextResponse.json({ answers: [] })
    }

    // Build query for answers
    let query = supabase
      .from('answers')
      .select(`
        *,
        question:questions(id, content),
        contributor:users!answers_contributor_id_fkey(id, email)
      `)
      .in('question_id', questionIds)

    if (questionId) {
      query = query.eq('question_id', questionId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      answers: data || [],
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



