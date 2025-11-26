import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignData } = body

    if (!campaignData) {
      return NextResponse.json(
        { error: 'campaignData is required' },
        { status: 400 }
      )
    }

    const summary = await generateSummary(campaignData)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    )
  }
}



