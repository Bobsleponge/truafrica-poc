import { NextRequest, NextResponse } from 'next/server'
import { calculateTotalPrice } from '@/lib/services/pricingService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      questions,
      numberOfRespondents,
      rewardBudget,
      urgency,
      targetCountries,
      qualityRules,
      analyticsDashboard,
      fineTuningDataset,
    } = body

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      )
    }

    const pricing = await calculateTotalPrice({
      questions,
      numberOfRespondents: numberOfRespondents || 1000,
      rewardBudget: rewardBudget || 0,
      urgency: urgency || 'standard',
      targetCountries: targetCountries || [],
      qualityRules,
      analyticsDashboard: analyticsDashboard || false,
      fineTuningDataset: fineTuningDataset || false,
    })

    return NextResponse.json({
      success: true,
      pricing,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}



