import { NextRequest, NextResponse } from 'next/server'
import { analyzeRisks } from '@/lib/services/aiService'

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

    const result = await analyzeRisks(campaignData)

    return NextResponse.json({
      success: true,
      risks: result.risks,
      mitigations: result.mitigations,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to analyze risks' },
      { status: 500 }
    )
  }
}



