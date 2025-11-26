import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get all answers
    const { data: answers } = await supabase
      .from('answers')
      .select('consensus_score, correct, created_at')

    const totalAnswers = answers?.length || 0
    const validAnswers = answers?.filter((a) => a.consensus_score !== null) || []
    const correctAnswers = answers?.filter((a) => a.correct === true) || []

    const averageConsensus = validAnswers.length > 0
      ? validAnswers.reduce((sum, a) => sum + Number(a.consensus_score || 0), 0) / validAnswers.length
      : 0

    const accuracy = totalAnswers > 0
      ? (correctAnswers.length / totalAnswers) * 100
      : 0

    // Get campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('status')

    const totalCampaigns = campaigns?.length || 0
    const activeCampaigns = campaigns?.filter((c) => c.status === 'running' || c.status === 'active').length || 0
    const completionRate = totalCampaigns > 0
      ? (campaigns?.filter((c) => c.status === 'completed').length || 0) / totalCampaigns * 100
      : 0

    return NextResponse.json({
      response_rate: totalAnswers > 0 ? (totalAnswers / (totalCampaigns * 10)) * 100 : 0, // Assuming 10 responses per campaign target
      completion_rate: completionRate,
      average_rewards: 0, // Calculate from rewards table if needed
      average_consensus: averageConsensus,
      accuracy: accuracy,
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



