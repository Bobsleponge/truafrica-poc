import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCampaignPricing } from '@/lib/services/pricingEngine'
import type { CampaignPricingRequest } from '@/lib/services/pricingEngine'

/**
 * POST /api/pricing/calculate
 * Calculate pricing for a campaign configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user (Manager), team account, or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, sub_role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'
    const isAdmin = userData.role === 'admin'

    if (!isClientOwner && !isClientUserManager && !isTeamAccount && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, team account, or admin access required' },
        { status: 403 }
      )
    }

    const body: CampaignPricingRequest = await request.json()

    // Validate request
    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    if (!body.urgency || !['standard', 'express'].includes(body.urgency)) {
      return NextResponse.json(
        { error: 'Urgency must be "standard" or "express"' },
        { status: 400 }
      )
    }

    // Calculate pricing
    const pricingResult = await calculateCampaignPricing(body)

    return NextResponse.json({
      success: true,
      pricing: pricingResult,
    })
  } catch (error: any) {
    console.error('Error calculating pricing:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


