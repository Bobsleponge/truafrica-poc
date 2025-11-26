import type { CampaignQuestionData, CurrencyType } from '@/types/campaign-builder'
import type {
  CampaignJourneyData,
  CampaignQuestion,
} from '@/types/campaign-journey'
import {
  calculateTotalRewardBudgetSync,
  calculateRewardPerQuestionSync,
} from '@/lib/services/rewardEngineClient'

const mapLegacyQuestionType = (type: CampaignQuestion['type']): CampaignQuestionData['questionType'] => {
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

const mapQuestion = (question: CampaignQuestion, respondents: number): CampaignQuestionData => ({
  id: question.id,
  content: question.title,
  questionType: mapLegacyQuestionType(question.type),
  options: question.options,
  complexityLevel:
    question.complexity === 'complex'
      ? 'hard'
      : question.complexity === 'balanced'
      ? 'medium'
      : 'easy',
  requiredResponses: respondents,
  rewardValue: question.reward,
})

export interface RewardEngineSummary {
  perQuestionReward: number
  perRespondentReward: number
  totalBudget: number
  sliderRange: { min: number; max: number }
  breakdown: ReturnType<typeof calculateTotalRewardBudgetSync>
}

export function computeRewardSummary(
  campaign: CampaignJourneyData
): RewardEngineSummary {
  const respondents = Math.max(campaign.scale.respondents || 0, 0)
  const currency = (campaign.rewards.currency || 'USD') as CurrencyType

  const mappedQuestions = campaign.questions.map((question) =>
    mapQuestion(question, respondents || 10)
  )

  const breakdown = calculateTotalRewardBudgetSync(mappedQuestions, respondents || 1, currency)

  const averagePerQuestion =
    mappedQuestions.length > 0
      ? mappedQuestions.reduce(
          (sum, q) => sum + calculateRewardPerQuestionSync(q, currency),
          0
        ) / mappedQuestions.length
      : 0

  // Standard calculation - no fairness multiplier
  const perQuestionReward = averagePerQuestion
  const perRespondentReward = perQuestionReward * mappedQuestions.length
  const totalBudget = perRespondentReward * respondents

  // Return default range for backward compatibility (not used in new UI)
  const sliderRange = {
    min: 0.5,
    max: 5.0,
  }

  return {
    perQuestionReward,
    perRespondentReward,
    totalBudget,
    sliderRange,
    breakdown,
  }
}

