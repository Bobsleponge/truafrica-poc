import { NextRequest, NextResponse } from 'next/server'
import { optimizeQuestions } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignData, questions } = body

    if (!campaignData || !questions) {
      return NextResponse.json(
        { error: 'campaignData and questions are required' },
        { status: 400 }
      )
    }

    const result = await optimizeQuestions(campaignData, questions)

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      optimizedQuestions: result.optimizedQuestions,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to optimize questions' },
      { status: 500 }
    )
  }
}



