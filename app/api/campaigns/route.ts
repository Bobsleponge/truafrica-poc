import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCampaignPricing, storePricingSnapshot } from '@/lib/services/pricingEngine'
import type { CampaignPricingRequest } from '@/lib/services/pricingEngine'

/**
 * GET /api/campaigns
 * Get all campaigns for the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user, team account, or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.role === 'admin'
    const isClientOwner = userData.role === 'client_owner'
    const isClientUser = userData.role === 'client_user'
    const isTeamAccount = userData.role === 'team_account'

    if (!isAdmin && !isClientOwner && !isClientUser && !isTeamAccount) {
      return NextResponse.json(
        { error: 'Forbidden - Client or team account access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_briefs (*),
        campaign_questions (
          id,
          question_id,
          question_type,
          required_responses,
          complexity_level,
          questions:question_id (
            id,
            content,
            difficulty_level,
            status
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by client_id if not admin or team account
    if (!isAdmin && !isTeamAccount) {
      // For client users, filter by their client_id
      if (isClientUser && userData.client_id) {
        // Get all users with the same client_id (including client_owner)
        const { data: clientUsers } = await supabase
          .from('users')
          .select('id')
          .eq('client_id', userData.client_id)
          .in('role', ['client_owner', 'client_user'])
        
        const clientUserIds = clientUsers?.map(u => u.id) || []
        query = query.in('client_id', clientUserIds)
      } else {
        // For client owners, filter by their own id
        query = query.eq('client_id', user.id)
      }
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || [],
    })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user (Manager), or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, sub_role, client_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.role === 'admin'
    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'

    if (!isAdmin && !isClientOwner && !isClientUserManager) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner or Manager access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      objective,
      targetCountries,
      targetDemo,
      brief,
      questions,
      urgency,
      needsQuestionDesign,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        client_id: user.id,
        name,
        description,
        objective,
        target_countries: targetCountries || [],
        target_demo: targetDemo || null,
        status: 'draft',
        needs_question_design: needsQuestionDesign || false,
      })
      .select()
      .single()

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    // Create campaign brief if provided
    if (brief) {
      await supabase.from('campaign_briefs').insert({
        campaign_id: campaign.id,
        goals: brief.goals,
        key_questions: brief.keyQuestions || [],
        constraints: brief.constraints,
        languages: brief.languages || [],
        budget: brief.budget,
        timeline: brief.timeline,
      })
    }

    // Create campaign questions and calculate pricing if questions provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const pricingRequest: CampaignPricingRequest = {
        questions: questions.map((q: any) => ({
          questionType: q.questionType || 'open_text',
          complexityLevel: q.complexityLevel || 'easy',
          requiredResponses: q.requiredResponses || 10,
        })),
        urgency: urgency || 'standard',
        targetCountries: targetCountries || [],
        demographicFilterCount: targetDemo ? Object.keys(targetDemo).length : 0,
      }

      // Calculate pricing
      const pricingResult = await calculateCampaignPricing(pricingRequest)

      // Store pricing snapshot
      await storePricingSnapshot(campaign.id, pricingResult)

      // Create questions and link to campaign
      for (const questionData of questions) {
        // Create question if question_id not provided
        let questionId = questionData.questionId

        if (!questionId && questionData.content) {
          // Create new question
          const { data: newQuestion, error: questionError } = await supabase
            .from('questions')
            .insert({
              client_id: user.id,
              field_id: questionData.fieldId,
              content: questionData.content,
              difficulty_level: questionData.complexityLevel || 'easy',
              status: 'active',
            })
            .select()
            .single()

          if (questionError) {
            console.error('Error creating question:', questionError)
            continue
          }

          questionId = newQuestion.id
        }

        if (questionId) {
          // Link question to campaign
          await supabase.from('campaign_questions').insert({
            campaign_id: campaign.id,
            question_id: questionId,
            question_type: questionData.questionType || 'open_text',
            required_responses: questionData.requiredResponses || 10,
            complexity_level: questionData.complexityLevel || 'easy',
            base_price_per_answer:
              pricingResult.breakdown.find(
                (b) =>
                  b.questionType === questionData.questionType &&
                  b.complexityLevel === questionData.complexityLevel
              )?.pricePerAnswer || null,
          })
        }
      }
    }

    // Fetch complete campaign with relations
    const { data: completeCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_briefs (*),
        campaign_questions (
          *,
          questions:question_id (*)
        )
      `)
      .eq('id', campaign.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch created campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: completeCampaign,
    })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


