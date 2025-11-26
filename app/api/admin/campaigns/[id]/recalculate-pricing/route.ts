import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import { calculateCampaignPricing } from '@/lib/services/pricingEngine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Get campaign with questions
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_questions (
            question_type,
            complexity_level,
            required_responses
          )
        `)
        .eq('id', id)
        .single()

      if (campaignError) throw campaignError

      if (!campaign.campaign_questions || campaign.campaign_questions.length === 0) {
        return NextResponse.json(
          { error: 'Campaign has no questions' },
          { status: 400 }
        )
      }

      // Prepare pricing request
      const pricingRequest = {
        questions: campaign.campaign_questions.map((cq: any) => ({
          questionType: cq.question_type,
          complexityLevel: cq.complexity_level || 'easy',
          requiredResponses: cq.required_responses || 10,
        })),
        urgency: campaign.urgency || 'standard',
        targetCountries: campaign.target_countries || [],
        demographicFilterCount: (campaign.age_bracket ? 1 : 0) + (campaign.occupation?.length || 0),
      }

      // Calculate pricing
      const pricingResult = await calculateCampaignPricing(pricingRequest)

      // Update campaign with new pricing
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          total_budget: pricingResult.totalRevenue,
          reward_budget: pricingResult.totalCost * 0.6, // Estimate 60% for rewards
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        pricing: pricingResult,
      })
    } catch (error: any) {
      console.error('Error recalculating pricing:', error)
      return NextResponse.json(
        { error: 'Failed to recalculate pricing', details: error.message },
        { status: 500 }
      )
    }
  })
}



