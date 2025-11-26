import { NextRequest, NextResponse } from 'next/server'
import { detectBias } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questions } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      )
    }

    const result = await detectBias(questions)

    return NextResponse.json({
      success: true,
      biasedQuestions: result.biasedQuestions,
      suggestions: result.suggestions,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to detect bias' },
      { status: 500 }
    )
  }
}



