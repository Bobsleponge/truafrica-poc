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

    // Get all question IDs for this campaign
    const { data: campaignQuestions } = await supabase
      .from('campaign_questions')
      .select('question_id')
      .eq('campaign_id', campaignId)

    const questionIds = campaignQuestions?.map((cq) => cq.question_id) || []

    if (questionIds.length === 0) {
      return NextResponse.json({ contributors: [] })
    }

    // Get unique contributors and their answer counts
    const { data: answers } = await supabase
      .from('answers')
      .select('contributor_id, question_id, consensus_score, correct, created_at')
      .in('question_id', questionIds)

    // Aggregate by contributor
    const contributorMap = new Map<string, {
      id: string
      answer_count: number
      total_consensus: number
      correct_count: number
      last_activity: string
    }>()

    answers?.forEach((answer) => {
      const existing = contributorMap.get(answer.contributor_id) || {
        id: answer.contributor_id,
        answer_count: 0,
        total_consensus: 0,
        correct_count: 0,
        last_activity: answer.created_at,
      }

      existing.answer_count++
      if (answer.consensus_score) {
        existing.total_consensus += Number(answer.consensus_score)
      }
      if (answer.correct) {
        existing.correct_count++
      }
      if (new Date(answer.created_at) > new Date(existing.last_activity)) {
        existing.last_activity = answer.created_at
      }

      contributorMap.set(answer.contributor_id, existing)
    })

    // Get contributor details
    const contributorIds = Array.from(contributorMap.keys())
    const { data: contributors } = await supabase
      .from('users')
      .select('id, email, name, trust_score, country')
      .in('id', contributorIds)

    const contributorsWithStats = contributors?.map((contributor) => {
      const stats = contributorMap.get(contributor.id) || {
        answer_count: 0,
        total_consensus: 0,
        correct_count: 0,
        last_activity: '',
      }

      return {
        ...contributor,
        answer_count: stats.answer_count,
        average_consensus: stats.answer_count > 0
          ? stats.total_consensus / stats.answer_count
          : 0,
        correct_count: stats.correct_count,
        accuracy: stats.answer_count > 0
          ? (stats.correct_count / stats.answer_count) * 100
          : 0,
        last_activity: stats.last_activity,
      }
    }) || []

    return NextResponse.json({
      contributors: contributorsWithStats.sort((a, b) => b.answer_count - a.answer_count),
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



