import { NextRequest, NextResponse } from 'next/server'
import { suggestPricing } from '@/lib/services/aiService'

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

    const suggestions = await suggestPricing(campaignData)

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to suggest pricing' },
      { status: 500 }
    )
  }
}



