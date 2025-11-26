import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTotalPrice } from '@/lib/services/pricingService'
import { storePricingSnapshot } from '@/lib/services/pricingEngine'
import { createVersion } from '@/lib/services/versionControlService'
import type { CampaignBuilderData, CampaignQuestionData } from '@/types/campaign-builder'

/**
 * POST /api/campaigns/[id]/finalize
 * Finalize a campaign by converting wizard_data to actual database records
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaignId = id

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Get campaign with wizard_data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError)
      return NextResponse.json(
        { error: 'Campaign not found', details: campaignError.message },
        { status: 404 }
      )
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin'
    const isTeamAccount = userData?.role === 'team_account'
    const isClientOwner = userData?.role === 'client_owner'
    const isClientUserManager = userData?.role === 'client_user' && userData.sub_role === 'Manager'
    
    // Check ownership - for client users, check if they share the same client_id
    let isOwner = campaign.client_id === user.id || campaign.internal_owner_id === user.id
    if (!isOwner && isClientUserManager && userData.client_id) {
      // Get the client owner's user id
      const { data: clientOwner } = await supabase
        .from('users')
        .select('id')
        .eq('client_id', userData.client_id)
        .eq('role', 'client_owner')
        .single()
      
      if (clientOwner) {
        isOwner = campaign.client_id === clientOwner.id
      }
    }

    if (!isAdmin && !isTeamAccount && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this campaign' },
        { status: 403 }
      )
    }

    const wizardData = campaign.wizard_data as CampaignBuilderData | null

    if (!wizardData) {
      return NextResponse.json(
        { error: 'Campaign wizard data not found. Please complete the wizard first.' },
        { status: 400 }
      )
    }

    const warnings: string[] = []

    // 1. Create questions from wizard_data.questions array
    const questions = wizardData.questions || []
    const createdQuestionIds: string[] = []

    if (questions.length === 0) {
      warnings.push('No questions found in wizard data')
    } else {
      for (const questionData of questions) {
        // Handle both CampaignQuestion (journey) and CampaignQuestionData (builder) structures
        // CampaignQuestion uses: title, type, complexity, required
        // CampaignQuestionData uses: content, questionType, complexityLevel, requiredResponses
        const content = (questionData as any).content || (questionData as any).title
        const questionType = (questionData as any).questionType || (questionData as any).type
        const complexityLevel = (questionData as any).complexityLevel || 
          ((questionData as any).complexity === 'simple' ? 'easy' : 
           (questionData as any).complexity === 'balanced' ? 'medium' : 
           (questionData as any).complexity === 'complex' ? 'hard' : 'easy')
        const requiredResponses = (questionData as any).requiredResponses || 
          ((questionData as any).required !== false ? 10 : 0)

        if (!content) {
          warnings.push(`Skipping question without content/title`)
          continue
        }

        // Map question type from journey format to database format
        const typeMapping: Record<string, string> = {
          'mcq': 'multiple_choice',
          'single_choice': 'single_choice',
          'short_text': 'short_text',
          'long_text': 'long_text',
          'rating': 'rating',
          'audio': 'audio',
          'image': 'image_classification',
          'video': 'video',
        }
        const mappedQuestionType = typeMapping[questionType as string] || questionType || 'open_text'

        // Create question record
        const { data: newQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            client_id: campaign.client_id,
            field_id: (questionData as any).fieldId || null,
            content: content,
            difficulty_level: complexityLevel as any,
            status: 'active',
            options: (questionData as any).options || null,
            branching_rules: (questionData as any).branchingRules || (questionData as any).branching || null,
            validation_type: (questionData as any).validationType || null,
            reward_value: (questionData as any).rewardValue || (questionData as any).reward || null,
            comparison_config: (questionData as any).comparisonConfig || null,
            image_config: (questionData as any).imageConfig || null,
            audio_config: (questionData as any).audioConfig || null,
            video_config: (questionData as any).videoConfig || null,
          })
          .select()
          .single()

        if (questionError) {
          console.error('Error creating question:', questionError)
          warnings.push(`Failed to create question: ${content?.substring(0, 50)}...`)
          continue
        }

        createdQuestionIds.push(newQuestion.id)

        // Link question to campaign via campaign_questions
        const { error: linkError } = await supabase
          .from('campaign_questions')
          .insert({
            campaign_id: campaignId,
            question_id: newQuestion.id,
            question_type: mappedQuestionType as any,
            required_responses: requiredResponses,
            complexity_level: complexityLevel as any,
          })

        if (linkError) {
          console.error('Error linking question to campaign:', linkError)
          warnings.push(`Failed to link question ${newQuestion.id} to campaign`)
        }
      }
    }

    // 2. Calculate final pricing and store snapshot
    let pricingSnapshotId: string | null = null
    if (questions.length > 0 && wizardData.numberOfRespondents) {
      try {
        const pricingResult = await calculateTotalPrice({
          questions: questions as CampaignQuestionData[],
          numberOfRespondents: wizardData.numberOfRespondents || 1000,
          rewardBudget: wizardData.rewardBudget || 0,
          urgency: wizardData.preferredTimelines?.urgency || 'standard',
          targetCountries: wizardData.targetCountries || [],
          qualityRules: wizardData.qualityRules,
          analyticsDashboard: wizardData.pricing?.analyticsFee ? true : false,
          fineTuningDataset: wizardData.aiTechnicalRequirements?.fineTuning || false,
        })

        // Store pricing snapshot
        await storePricingSnapshot(campaignId, {
          totalCost: pricingResult.totalCost,
          totalRevenue: pricingResult.totalPrice,
          totalMargin: pricingResult.margin,
          marginPercentage: pricingResult.marginPercentage,
          breakdown: questions.map((q, idx) => ({
            questionType: (q.questionType || 'open_text') as any,
            complexityLevel: (q.complexityLevel || 'easy') as any,
            requiredResponses: q.requiredResponses || 10,
            costPerAnswer: pricingResult.perResponseFee,
            pricePerAnswer: pricingResult.perResponseFee,
            totalCost: pricingResult.totalCost / questions.length,
            totalPrice: pricingResult.totalPrice / questions.length,
            margin: pricingResult.margin / questions.length,
            marginPercentage: pricingResult.marginPercentage,
          })),
          validation: pricingResult.validation,
          currency: 'USD',
        })

        // Update campaign with pricing fields
        await supabase
          .from('campaigns')
          .update({
            total_budget: pricingResult.totalPrice,
            reward_budget: pricingResult.rewardBudget,
            setup_fee: pricingResult.setupFee,
            per_response_fee: pricingResult.perResponseFee,
            validation_fee: pricingResult.validationFee,
            analytics_fee: pricingResult.analyticsFee,
            fine_tuning_fee: pricingResult.fineTuningFee,
          })
          .eq('id', campaignId)
      } catch (pricingError: any) {
        console.error('Error calculating pricing:', pricingError)
        warnings.push(`Failed to calculate pricing: ${pricingError.message}`)
      }
    }

    // 3. Create reward_configurations record
    if (wizardData.rewardConfiguration) {
      const { error: rewardError } = await supabase
        .from('reward_configurations')
        .upsert({
          campaign_id: campaignId,
          currency: wizardData.rewardConfiguration.currency || 'USD',
          distribution_method: wizardData.rewardConfiguration.distributionMethod || 'mobile_money',
          min_payout: wizardData.rewardConfiguration.minPayout || null,
          max_payout: wizardData.rewardConfiguration.maxPayout || null,
          per_question_rewards: wizardData.rewardConfiguration.perQuestionRewards || {},
          per_task_type_rewards: wizardData.rewardConfiguration.perTaskTypeRewards || {},
          total_budget: wizardData.rewardBudget || null,
          payout_per_1000_responses: wizardData.payoutPer1000Responses || null,
        }, {
          onConflict: 'campaign_id',
        })

      if (rewardError) {
        console.error('Error creating reward configuration:', rewardError)
        warnings.push('Failed to create reward configuration')
      }
    }

    // 4. Create campaign_quality_rules record
    if (wizardData.qualityRules) {
      const { error: qualityError } = await supabase
        .from('campaign_quality_rules')
        .upsert({
          campaign_id: campaignId,
          validation_layers: {
            layers: wizardData.qualityRules.validationLayers || [],
          },
          geo_verification: wizardData.qualityRules.geoVerification || false,
          duplicate_detection: wizardData.qualityRules.duplicateDetection !== false,
          ai_scoring_enabled: wizardData.qualityRules.aiScoringEnabled || false,
          disqualification_rules: wizardData.qualityRules.disqualificationRules || {},
          confidence_threshold: wizardData.qualityRules.confidenceThreshold || 70.0,
        }, {
          onConflict: 'campaign_id',
        })

      if (qualityError) {
        console.error('Error creating quality rules:', qualityError)
        warnings.push('Failed to create quality rules')
      }
    }

    // 5. Create initial version
    try {
      await createVersion(
        campaignId,
        wizardData,
        user.id,
        'Initial version from wizard finalization'
      )
    } catch (versionError: any) {
      console.error('Error creating version:', versionError)
      warnings.push(`Failed to create version: ${versionError.message}`)
    }

    // 6. Update campaign status to 'draft' (ready for approval)
    // Don't change status if it's already beyond draft
    if (campaign.status === 'draft') {
      await supabase
        .from('campaigns')
        .update({
          status: 'draft',
          approval_status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign finalized successfully',
      createdQuestions: createdQuestionIds.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  } catch (error: any) {
    console.error('Error finalizing campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to finalize campaign' },
      { status: 500 }
    )
  }
}
