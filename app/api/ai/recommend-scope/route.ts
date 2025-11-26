import { NextRequest, NextResponse } from 'next/server'
import { recommendScope } from '@/lib/services/aiService'

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

    const recommendations = await recommendScope(campaignData)

    return NextResponse.json({
      success: true,
      recommendations,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to recommend scope' },
      { status: 500 }
    )
  }
}



