/**
 * Client-Safe Reward Engine
 * Synchronous reward calculations for use in client components
 * Uses default multipliers (no database access)
 */

import type { CampaignQuestionData, CurrencyType } from '@/types/campaign-builder'

// Constants for client-side calculations (fallback values)
const BASE_REWARD_ZAR = 5.0
const COST_OF_LIVING_MULTIPLIERS: Record<CurrencyType, number> = {
  ZAR: 1.0,
  KES: 0.15,
  NGN: 0.05,
  USD: 0.055,
}

/**
 * Default complexity multipliers
 */
const DEFAULT_COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  'easy': 1.0,
  'medium': 1.2,
  'hard': 1.5,
}

/**
 * Default task type multipliers
 */
const DEFAULT_TASK_TYPE_MULTIPLIERS: Record<string, number> = {
  'audio': 1.5,
  'video': 2.0,
  'image_classification': 1.3,
  'text': 1.0,
  'short_text': 0.9,
  'long_text': 1.2,
  'multiple_choice': 0.8,
  'single_choice': 0.7,
  'rating': 0.6,
  'rating_scale': 0.7,
  'comparison': 1.1,
  'open_text': 1.0,
}

export interface RewardCalculationResult {
  perQuestionRewards: Record<string, number>
  perTaskTypeRewards: Record<string, number>
  totalBudget: number
  payoutPer1000: number
  perRespondent: number
  breakdown: Array<{
    questionIndex: number
    questionType: string
    rewardPerResponse: number
    totalForQuestion: number
    responses: number
  }>
}

/**
 * Get cost of living multiplier (using defaults)
 */
function getCostOfLivingMultiplier(currency: CurrencyType): number {
  return COST_OF_LIVING_MULTIPLIERS[currency] || COST_OF_LIVING_MULTIPLIERS.USD
}

/**
 * Get task type multiplier (using defaults)
 */
function getDefaultTaskTypeMultiplier(taskType: string): number {
  return DEFAULT_TASK_TYPE_MULTIPLIERS[taskType] || 1.0
}

/**
 * Calculate reward per question (CLIENT-SAFE VERSION - synchronous, no DB access)
 * Uses default multipliers for client-side calculations
 */
export function calculateRewardPerQuestionSync(
  question: CampaignQuestionData,
  currency: CurrencyType = 'USD'
): number {
  const questionType = question.questionType || 'short_text'
  const baseReward = BASE_REWARD_ZAR
  
  // Get task type multiplier (using defaults)
  const taskMultiplier = getDefaultTaskTypeMultiplier(questionType)
  
  // Get complexity multiplier (using defaults)
  const complexity = question.complexityLevel || 'easy'
  const complexityMultiplier = DEFAULT_COMPLEXITY_MULTIPLIERS[complexity] || 1.0

  // Calculate base reward
  const calculatedReward = baseReward * taskMultiplier * complexityMultiplier

  // Apply cost of living multiplier
  const colMultiplier = getCostOfLivingMultiplier(currency)

  return calculatedReward * colMultiplier
}

/**
 * Calculate total reward budget for a campaign (CLIENT-SAFE VERSION - synchronous, no DB access)
 * Uses default multipliers for client-side calculations
 */
export function calculateTotalRewardBudgetSync(
  questions: CampaignQuestionData[],
  numberOfRespondents: number,
  currency: CurrencyType = 'USD'
): RewardCalculationResult {
  const perQuestionRewards: Record<string, number> = {}
  const perTaskTypeRewards: Record<string, number> = {}
  const breakdown: RewardCalculationResult['breakdown'] = []

  let totalBudget = 0

  for (const question of questions) {
    const rewardPerResponse = calculateRewardPerQuestionSync(question, currency)
    const responses = question.requiredResponses || 10
    const totalForQuestion = rewardPerResponse * responses

    perQuestionRewards[question.id || `q${questions.indexOf(question)}`] = rewardPerResponse
    
    const taskType = question.questionType || 'short_text'
    if (!perTaskTypeRewards[taskType]) {
      const taskMultiplier = getDefaultTaskTypeMultiplier(taskType)
      const baseReward = BASE_REWARD_ZAR
      const colMultiplier = getCostOfLivingMultiplier(currency)
      perTaskTypeRewards[taskType] = baseReward * taskMultiplier * colMultiplier
    }

    breakdown.push({
      questionIndex: questions.indexOf(question),
      questionType: taskType,
      rewardPerResponse,
      totalForQuestion,
      responses,
    })

    totalBudget += totalForQuestion
  }

  // Scale by number of respondents
  const totalForAllRespondents = totalBudget * numberOfRespondents
  const payoutPer1000 = questions.length > 0 ? (totalBudget / questions.length) * 1000 : 0
  const perRespondent = questions.length > 0 ? totalBudget / questions.length : 0

  return {
    perQuestionRewards,
    perTaskTypeRewards,
    totalBudget: totalForAllRespondents,
    payoutPer1000,
    perRespondent,
    breakdown,
  }
}



