import { calculateTotalPrice, type FullPricingRequest } from '@/lib/services/pricingService'
import type { CampaignQuestionData } from '@/types/campaign-builder'
import type {
  CampaignJourneyData,
  GoalModality,
  PricingBreakdown,
  QuestionKind,
} from '@/types/campaign-journey'

const mapQuestionType = (type: QuestionKind): CampaignQuestionData['questionType'] => {
  switch (type) {
    case 'mcq':
      return 'multiple_choice'
    case 'single_choice':
      return 'single_choice'
    case 'short_text':
      return 'short_text'
    case 'long_text':
      return 'long_text'
    case 'rating':
      return 'rating'
    case 'audio':
      return 'audio'
    case 'image':
      return 'image_classification'
    case 'video':
      return 'video'
    default:
      return 'open_text'
  }
}

const mapComplexity = (complexity?: string): CampaignQuestionData['complexityLevel'] => {
  if (complexity === 'complex') return 'hard'
  if (complexity === 'balanced') return 'medium'
  return 'easy'
}

const inferFineTuning = (goal?: GoalModality) => goal === 'fine_tuning'

export async function getPricingBreakdownFromJourney(
  campaign: CampaignJourneyData
): Promise<PricingBreakdown> {
  const respondents = Math.max(campaign.scale.respondents || 0, 0)

  const mappedQuestions: CampaignQuestionData[] = campaign.questions.map((question) => {
    const baselineResponses = question.required
      ? respondents
      : Math.max(Math.floor((respondents || 0) / 2), 10)

    return {
      id: question.id,
      content: question.title,
      questionType: mapQuestionType(question.type),
      options: question.options,
      complexityLevel: mapComplexity(question.complexity),
      requiredResponses: Math.max(baselineResponses, 10),
      rewardValue: question.reward,
    }
  })

  const rewardBudget =
    campaign.rewards.computedTotalBudget ||
    Math.max(
      (campaign.rewards.computedRewardPerRespondent || campaign.rewards.computedRewardPerQuestion || 1) *
        respondents,
      0
    )

  const pricingRequest: FullPricingRequest = {
    questions: mappedQuestions,
    numberOfRespondents: respondents,
    rewardBudget,
    urgency: 'standard',
    targetCountries: campaign.audience.country ? [campaign.audience.country] : [],
    qualityRules: {
      validationLayers: campaign.scale.validationStrictness === 'high'
        ? ['geo', 'duplicate', 'ai', 'manual']
        : campaign.scale.validationStrictness === 'medium'
        ? ['geo', 'duplicate']
        : ['basic'],
      geoVerification: campaign.scale.autoGeoVerification,
      duplicateDetection: campaign.scale.autoDuplicateDetection,
      aiScoringEnabled: campaign.scale.aiQualityScoring,
    },
    analyticsDashboard: true,
    fineTuningDataset: inferFineTuning(campaign.goals.primaryGoal),
  }

  const pricing = await calculateTotalPrice(pricingRequest)

  const breakdown: PricingBreakdown = {
    setupFee: pricing.setupFee,
    perResponseFee: pricing.perResponseFee,
    rewardBudget: pricing.rewardBudget,
    validationFee: pricing.validationFee,
    analyticsFee: pricing.analyticsFee,
    fineTuningFee: pricing.fineTuningFee,
    internalMargin: Number(pricing.marginPercentage.toFixed(2)),
    recommendedDiscount: pricing.suggestedDiscount
      ? (pricing.suggestedDiscount.min + pricing.suggestedDiscount.max) / 2
      : 0,
    total: pricing.totalPrice,
  }

  return breakdown
}

