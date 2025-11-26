import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateConsensusScore, isAnswerCorrect } from '@/lib/utils/consensus'
import { calculateNewTrustScore } from '@/lib/utils/trustScore'
import { allocateReward } from '@/lib/utils/rewards'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { answerId } = body

    if (!answerId) {
      return NextResponse.json({ error: 'Answer ID is required' }, { status: 400 })
    }

    // Get the answer
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('*, questions:question_id(*)')
      .eq('id', answerId)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Check if consensus already calculated
    if (answer.consensus_score !== null) {
      return NextResponse.json({
        message: 'Consensus already calculated',
        answer: {
          ...answer,
          consensus_score: answer.consensus_score,
          correct: answer.correct,
        },
      })
    }

    // Get all other answers for the same question
    const { data: otherAnswers, error: othersError } = await supabase
      .from('answers')
      .select('answer_text')
      .eq('question_id', answer.question_id)
      .neq('id', answerId)

    if (othersError) {
      return NextResponse.json({ error: 'Failed to fetch other answers' }, { status: 500 })
    }

    // Calculate consensus score
    const otherAnswerTexts = (otherAnswers || []).map(a => a.answer_text)
    const consensusScore = calculateConsensusScore(answer.answer_text, otherAnswerTexts)
    const isCorrect = isAnswerCorrect(consensusScore)

    // Update answer with consensus score
    const { error: updateError } = await supabase
      .from('answers')
      .update({
        consensus_score: consensusScore,
        correct: isCorrect,
      })
      .eq('id', answerId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update answer' }, { status: 500 })
    }

    // Update contributor trust score
    const { data: contributor } = await supabase
      .from('users')
      .select('trust_score')
      .eq('id', answer.contributor_id)
      .single()

    if (contributor) {
      const newTrustScore = calculateNewTrustScore(
        Number(contributor.trust_score),
        isCorrect,
        consensusScore
      )

      await supabase
        .from('users')
        .update({ trust_score: newTrustScore })
        .eq('id', answer.contributor_id)

      // Record rating change
      await supabase
        .from('ratings')
        .insert({
          contributor_id: answer.contributor_id,
          question_id: answer.question_id,
          rating_change: newTrustScore - Number(contributor.trust_score),
          reason: isCorrect
            ? `Correct answer with ${consensusScore.toFixed(1)}% consensus`
            : `Incorrect answer with ${consensusScore.toFixed(1)}% consensus`,
        })
    }

    // Allocate reward if answer is correct
    if (isCorrect) {
      const reward = allocateReward(answer.contributor_id, consensusScore)
      
      await supabase
        .from('rewards')
        .insert({
          contributor_id: answer.contributor_id,
          reward_type: reward.rewardType,
          value: reward.value,
          status: reward.status,
        })
    }

    return NextResponse.json({
      success: true,
      answer: {
        ...answer,
        consensus_score: consensusScore,
        correct: isCorrect,
      },
    })
  } catch (error: any) {
    console.error('Error calculating consensus:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

