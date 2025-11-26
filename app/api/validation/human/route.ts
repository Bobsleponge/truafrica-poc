import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/validation/human
 * Get list of flagged answers needing human validation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get flagged answers with related data
    const { data: flaggedAnswers, error: fetchError } = await supabase
      .from('flagged_answers')
      .select(`
        *,
        answers:answer_id (
          id,
          answer_text,
          validation_confidence_score,
          consensus_score,
          correct,
          created_at,
          questions:question_id (
            id,
            content,
            difficulty_level
          ),
          users:contributor_id (
            id,
            name,
            trust_score
          )
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch flagged answers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      flaggedAnswers: flaggedAnswers || [],
      pagination: {
        limit,
        offset,
        hasMore: (flaggedAnswers || []).length === limit,
      },
    })
  } catch (error: any) {
    console.error('Error fetching flagged answers:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/validation/human
 * Resolve a flagged answer (mark as resolved or invalid)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { flaggedAnswerId, resolution, notes, correct } = body

    if (!flaggedAnswerId || !resolution) {
      return NextResponse.json(
        { error: 'Flagged answer ID and resolution are required' },
        { status: 400 }
      )
    }

    if (!['resolved', 'invalid'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Resolution must be "resolved" or "invalid"' },
        { status: 400 }
      )
    }

    // Get the flagged answer to find the answer_id
    const { data: flaggedAnswer, error: fetchError } = await supabase
      .from('flagged_answers')
      .select('answer_id')
      .eq('id', flaggedAnswerId)
      .single()

    if (fetchError || !flaggedAnswer) {
      return NextResponse.json({ error: 'Flagged answer not found' }, { status: 404 })
    }

    // Update the flagged answer
    const { error: updateError } = await supabase
      .from('flagged_answers')
      .update({
        status: resolution,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes || null,
      })
      .eq('id', flaggedAnswerId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update flagged answer' }, { status: 500 })
    }

    // If resolution is "resolved" and correct value is provided, update the answer
    if (resolution === 'resolved' && typeof correct === 'boolean') {
      const { error: answerUpdateError } = await supabase
        .from('answers')
        .update({
          correct,
          validation_confidence_score: correct ? 100 : 0, // Human validation gets full confidence
        })
        .eq('id', flaggedAnswer.answer_id)

      if (answerUpdateError) {
        console.error('Error updating answer:', answerUpdateError)
        // Don't fail the request, just log the error
      }

      // Create a validation event for human validation
      await supabase.from('validation_events').insert({
        answer_id: flaggedAnswer.answer_id,
        validation_type: 'human_validator',
        confidence_score: 100,
        validator_id: user.id,
        metadata: {
          resolution,
          notes,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Flagged answer marked as ${resolution}`,
    })
  } catch (error: any) {
    console.error('Error resolving flagged answer:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}




