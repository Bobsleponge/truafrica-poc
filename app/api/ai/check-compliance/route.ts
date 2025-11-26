import { NextRequest, NextResponse } from 'next/server'
import { checkCompliance } from '@/lib/services/aiService'

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

    const result = await checkCompliance(campaignData)

    return NextResponse.json({
      success: true,
      compliant: result.compliant,
      issues: result.issues,
      recommendations: result.recommendations,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check compliance' },
      { status: 500 }
    )
  }
}



