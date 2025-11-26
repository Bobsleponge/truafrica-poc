import { NextRequest, NextResponse } from 'next/server'
import { calculateTotalRewardBudget } from '@/lib/services/rewardEngine'
import type { CurrencyType } from '@/types/campaign-builder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questions, currency, distributionMethod, targetCountries } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      )
    }

    // Calculate number of respondents (estimate if not provided)
    const numberOfRespondents = body.numberOfRespondents || 1000

    const rewards = await calculateTotalRewardBudget(
      questions,
      numberOfRespondents,
      (currency || 'USD') as CurrencyType
    )

    return NextResponse.json({
      success: true,
      rewards,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to calculate rewards' },
      { status: 500 }
    )
  }
}

