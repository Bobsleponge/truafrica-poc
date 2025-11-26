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
    const { id: userId } = await params

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    let statistics: any = {
      total_answers: 0,
      trust_score: 0,
      participation_rate: 0,
      reward_history: [],
    }

    if (user?.role === 'contributor') {
      // Get answers
      const { data: answers } = await supabase
        .from('answers')
        .select('consensus_score, correct, created_at')
        .eq('contributor_id', userId)

      statistics.total_answers = answers?.length || 0
      statistics.trust_score = user.trust_score || 0

      // Calculate participation rate (answers per day or similar metric)
      if (answers && answers.length > 0) {
        const firstAnswer = new Date(answers[answers.length - 1].created_at)
        const daysSinceFirst = Math.max(1, Math.floor((Date.now() - firstAnswer.getTime()) / (1000 * 60 * 60 * 24)))
        statistics.participation_rate = (answers.length / daysSinceFirst).toFixed(2)
      }

      // Get rewards
      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('contributor_id', userId)
        .order('awarded_at', { ascending: false })
        .limit(50)

      statistics.reward_history = rewards || []
    } else if (user?.role === 'client' || user?.role === 'company') {
      // Get campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, status, total_budget')
        .eq('client_id', userId)

      statistics.total_campaigns = campaigns?.length || 0
      statistics.active_campaigns = campaigns?.filter((c) => c.status === 'running' || c.status === 'active').length || 0
      statistics.total_spend = campaigns?.reduce((sum, c) => sum + Number(c.total_budget || 0), 0) || 0
    }

    return NextResponse.json({
      statistics,
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



