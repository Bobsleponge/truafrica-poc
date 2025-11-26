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

    // Get campaign questions
    const { data: campaignQuestions } = await supabase
      .from('campaign_questions')
      .select('question_id, required_responses')
      .eq('campaign_id', campaignId)

    const questionIds = campaignQuestions?.map((cq) => cq.question_id) || []
    const totalRequired = campaignQuestions?.reduce((sum, cq) => sum + (cq.required_responses || 0), 0) || 0

    // Get answers
    const { data: answers } = await supabase
      .from('answers')
      .select('question_id, created_at, consensus_score, correct')
      .in('question_id', questionIds)

    // Calculate metrics
    const totalAnswers = answers?.length || 0
    const totalQuestions = questionIds.length
    const completionRate = totalRequired > 0 ? (totalAnswers / totalRequired) * 100 : 0
    const responseRate = totalQuestions > 0 ? (totalAnswers / (totalQuestions * 10)) * 100 : 0 // Assuming 10 responses per question target

    // Time series data (answers over time)
    const answersByDate = new Map<string, number>()
    answers?.forEach((answer) => {
      const date = new Date(answer.created_at).toISOString().split('T')[0]
      answersByDate.set(date, (answersByDate.get(date) || 0) + 1)
    })

    const timeSeries = Array.from(answersByDate.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Geographic distribution (from contributors)
    const contributorIds = [...new Set(answers?.map((a) => a.contributor_id) || [])]
    const { data: contributors } = await supabase
      .from('users')
      .select('id, country')
      .in('id', contributorIds)

    const geographicData = (contributors || []).reduce((acc, contributor) => {
      const country = contributor.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Quality metrics
    const validAnswers = answers?.filter((a) => a.consensus_score !== null) || []
    const averageConsensus = validAnswers.length > 0
      ? validAnswers.reduce((sum, a) => sum + Number(a.consensus_score || 0), 0) / validAnswers.length
      : 0

    const correctAnswers = answers?.filter((a) => a.correct === true) || []
    const accuracy = answers && answers.length > 0
      ? (correctAnswers.length / answers.length) * 100
      : 0

    return NextResponse.json({
      metrics: {
        total_questions: totalQuestions,
        total_answers: totalAnswers,
        total_required: totalRequired,
        completion_rate: completionRate,
        response_rate: responseRate,
        average_consensus: averageConsensus,
        accuracy: accuracy,
      },
      time_series: timeSeries,
      geographic: Object.entries(geographicData).map(([country, count]) => ({
        country,
        count,
      })),
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



