import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAnswer, shouldFlagForHumanReview } from '@/lib/utils/validation'
import type { ValidationType } from '@/types/database'

/**
 * POST /api/validation
 * Validate an answer using multi-layer validation
 */
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

    // Get the answer with question and contributor info
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select(`
        *,
        questions:question_id (
          id,
          content,
          difficulty_level
        ),
        users:contributor_id (
          trust_score
        )
      `)
      .eq('id', answerId)
      .single()

    if (answerError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Get question type from campaign_questions if available
    const { data: campaignQuestion } = await supabase
      .from('campaign_questions')
      .select('question_type')
      .eq('question_id', answer.question_id)
      .single()

    const questionType = (campaignQuestion?.question_type as any) || 'open_text'

    // Get all other answers for the same question
    const { data: otherAnswers, error: othersError } = await supabase
      .from('answers')
      .select('answer_text')
      .eq('question_id', answer.question_id)
      .neq('id', answerId)

    if (othersError) {
      return NextResponse.json({ error: 'Failed to fetch other answers' }, { status: 500 })
    }

    // Run validation
    const validationResult = await validateAnswer({
      answerId: answer.id,
      answerText: answer.answer_text,
      questionId: answer.question_id,
      questionText: (answer.questions as any)?.content || '',
      questionType,
      otherAnswers: (otherAnswers || []).map(a => a.answer_text),
      contributorTrustScore: (answer.users as any)?.trust_score,
    })

    // Store validation events
    const validationEvents: Array<{
      answer_id: string
      validation_type: ValidationType
      confidence_score: number | null
      metadata: Record<string, any>
    }> = []

    if (validationResult.validationDetails.majorityVoting) {
      validationEvents.push({
        answer_id: answerId,
        validation_type: 'majority_voting',
        confidence_score: validationResult.validationDetails.majorityVoting.confidence,
        metadata: {
          majorityValue: validationResult.validationDetails.majorityVoting.majorityValue,
        },
      })
    }

    if (validationResult.validationDetails.textSimilarity) {
      validationEvents.push({
        answer_id: answerId,
        validation_type: 'text_similarity',
        confidence_score: validationResult.validationDetails.textSimilarity.consensusScore,
        metadata: {},
      })
    }

    if (validationResult.validationDetails.mlConfidence) {
      validationEvents.push({
        answer_id: answerId,
        validation_type: 'ml_confidence',
        confidence_score: validationResult.validationDetails.mlConfidence.confidence,
        metadata: {
          model: validationResult.validationDetails.mlConfidence.model,
        },
      })
    }

    // Insert validation events
    if (validationEvents.length > 0) {
      await supabase.from('validation_events').insert(validationEvents)
    }

    // Update answer with validation results
    const { error: updateError } = await supabase
      .from('answers')
      .update({
        validation_confidence_score: validationResult.confidenceScore,
        correct: validationResult.isValid,
        consensus_score: validationResult.validationDetails.textSimilarity?.consensusScore || null,
      })
      .eq('id', answerId)

    if (updateError) {
      console.error('Error updating answer:', updateError)
    }

    // Flag answer for human review if needed
    if (shouldFlagForHumanReview(validationResult)) {
      const { error: flagError } = await supabase
        .from('flagged_answers')
        .insert({
          answer_id: answerId,
          reason: validationResult.flagReason || 'Low confidence score',
          status: 'pending',
        })
        .select()
        .single()

      if (flagError && flagError.code !== '23505') {
        // Ignore duplicate key errors
        console.error('Error flagging answer:', flagError)
      }
    }

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        confidenceScore: validationResult.confidenceScore,
        shouldFlag: validationResult.shouldFlag,
        flagReason: validationResult.flagReason,
        details: validationResult.validationDetails,
      },
    })
  } catch (error: any) {
    console.error('Error validating answer:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}




