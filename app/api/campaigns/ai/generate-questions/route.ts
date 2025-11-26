import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCampaignQuestions } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const questions = await generateCampaignQuestions({
      overview: body.overview,
      goals: body.goals,
      audience: body.audience,
      existingQuestions: body.existingQuestions || [],
      count: body.count,
    })

    return NextResponse.json({ success: true, questions })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

