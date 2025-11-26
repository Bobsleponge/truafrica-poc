/**
 * Enhanced Reward Engine
 * Calculates rewards with African cost-of-living alignment
 * Now reads from global configuration tables
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

// Cache for configuration data
let configCache: {
  rewardRules: Map<string, any>
  costOfLiving: Map<string, number>
  taskTypeMultipliers: Map<string, number>
  complexityMultipliers: Map<string, number>
  lastUpdated: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load reward configuration from database
 */
async function loadRewardConfig(): Promise<{
  rewardRules: Map<string, any>
  costOfLiving: Map<string, number>
  taskTypeMultipliers: Map<string, number>
  complexityMultipliers: Map<string, number>
}> {
  // Return cached config if still valid
  if (configCache && Date.now() - configCache.lastUpdated < CACHE_TTL) {
    return configCache
  }

  // Dynamic import to avoid loading server code in client components
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Get global reward rules
  const { data: rewardRules } = await supabase
    .from('global_reward_rules')
    .select('*')
    .eq('is_active', true)

  // Get cost of living multipliers
  const { data: colMultipliers } = await supabase
    .from('cost_of_living_multipliers')
    .select('*')

  // Get task type configurations
  const { data: taskTypeConfigs } = await supabase
    .from('task_type_configurations')
    .select('*')
    .eq('is_active', true)

  // Get complexity configurations
  const { data: complexityConfigs } = await supabase
    .from('complexity_configurations')
    .select('*')
    .eq('is_active', true)

  // Build maps
  const rewardRulesMap = new Map()
  rewardRules?.forEach(rule => {
    rewardRulesMap.set(`${rule.question_type}_${rule.currency}`, rule)
  })

  const colMap = new Map()
  colMultipliers?.forEach(mult => {
    colMap.set(`${mult.country_code}_${mult.currency}`, Number(mult.multiplier))
  })

  const taskTypeMap = new Map()
  taskTypeConfigs?.forEach(config => {
    taskTypeMap.set(config.task_type, Number(config.base_reward_multiplier))
  })

  const complexityMap = new Map()
  complexityConfigs?.forEach(config => {
    complexityMap.set(config.difficulty_level, Number(config.multiplier_value))
  })

  configCache = {
    rewardRules: rewardRulesMap,
    costOfLiving: colMap,
    taskTypeMultipliers: taskTypeMap,
    complexityMultipliers: complexityMap,
    lastUpdated: Date.now(),
  }

  return configCache
}

/**
 * Get cost of living multiplier (fallback to defaults if not in DB)
 */
function getCostOfLivingMultiplier(currency: CurrencyType, countryCode?: string): number {
  return COST_OF_LIVING_MULTIPLIERS[currency] || COST_OF_LIVING_MULTIPLIERS.USD
}

/**
 * Get task type multiplier (fallback to defaults if not in DB)
 */
function getTaskTypeMultiplier(taskType: string, multipliers: Map<string, number>): number {
  return multipliers.get(taskType) || getDefaultTaskTypeMultiplier(taskType)
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

/**
 * Get complexity multiplier (fallback to defaults if not in DB)
 */
function getComplexityMultiplier(complexity: string, multipliers: Map<string, number>): number {
  return multipliers.get(complexity) || DEFAULT_COMPLEXITY_MULTIPLIERS[complexity] || 1.0
}

/**
 * Get task type multiplier (fallback to defaults if not in DB)
 */
function getDefaultTaskTypeMultiplier(taskType: string): number {
  return DEFAULT_TASK_TYPE_MULTIPLIERS[taskType] || 1.0
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

// Client-safe functions are now in rewardEngineClient.ts
// Re-export them for convenience
export {
  calculateRewardPerQuestionSync,
  calculateTotalRewardBudgetSync,
  type RewardCalculationResult,
} from './rewardEngineClient'

/**
 * Calculate reward per question based on type and complexity
 * Now uses global configuration tables (SERVER-ONLY - requires DB access)
 */
export async function calculateRewardPerQuestion(
  question: CampaignQuestionData,
  currency: CurrencyType = 'USD'
): Promise<number> {
  const config = await loadRewardConfig()
  const questionType = question.questionType || 'short_text'
  
  // Get base reward from global rules or use default
  const ruleKey = `${questionType}_${currency}`
  const rewardRule = config.rewardRules.get(ruleKey)
  const baseReward = rewardRule 
    ? Number(rewardRule.base_reward_per_question)
    : BASE_REWARD_ZAR

  // Get task type multiplier
  const taskMultiplier = getTaskTypeMultiplier(questionType, config.taskTypeMultipliers)
  
  // Get complexity multiplier
  const complexityMultiplier = getComplexityMultiplier(
    question.complexityLevel || 'easy',
    config.complexityMultipliers
  )

  // Calculate base reward
  const calculatedReward = baseReward * taskMultiplier * complexityMultiplier

  // Apply cost of living multiplier
  const colKey = `_${currency}` // Use currency-only key for now
  const colMultiplier = config.costOfLiving.get(colKey) || getCostOfLivingMultiplier(currency)

  return calculatedReward * colMultiplier
}

/**
 * Calculate reward per task type
 * Now uses global configuration tables
 */
export async function calculateRewardPerTaskType(
  taskType: string,
  currency: CurrencyType = 'USD'
): Promise<number> {
  const config = await loadRewardConfig()
  const taskMultiplier = getTaskTypeMultiplier(taskType, config.taskTypeMultipliers)
  const baseReward = 5.0 // Default base reward in ZAR
  const colKey = `_${currency}`
  const currencyMultiplier = config.costOfLiving.get(colKey) || getCostOfLivingMultiplier(currency)
  return baseReward * taskMultiplier * currencyMultiplier
}

/**
 * Align reward with African cost-of-living
 */
export function alignWithCostOfLiving(
  baseReward: number,
  currency: CurrencyType,
  country?: string
): number {
  const currencyMultiplier = COST_OF_LIVING_MULTIPLIERS[currency]
  
  // Country-specific adjustments (if needed)
  const countryAdjustments: Record<string, number> = {
    'South Africa': 1.0,
    'Kenya': 0.15,
    'Nigeria': 0.05,
    'Ghana': 0.12,
    'Tanzania': 0.14,
    'Uganda': 0.13,
  }

  const countryMultiplier = country ? (countryAdjustments[country] || 1.0) : 1.0
  
  return baseReward * currencyMultiplier * countryMultiplier
}

/**
 * Calculate total reward budget for a campaign
 * Now uses global configuration tables (SERVER-ONLY - requires DB access)
 */
export async function calculateTotalRewardBudget(
  questions: CampaignQuestionData[],
  numberOfRespondents: number,
  currency: CurrencyType = 'USD'
): Promise<RewardCalculationResult> {
  const perQuestionRewards: Record<string, number> = {}
  const perTaskTypeRewards: Record<string, number> = {}
  const breakdown: RewardCalculationResult['breakdown'] = []

  let totalBudget = 0

  for (const question of questions) {
    const rewardPerResponse = await calculateRewardPerQuestion(question, currency)
    const responses = question.requiredResponses || 10
    const totalForQuestion = rewardPerResponse * responses

    perQuestionRewards[question.id || `q${questions.indexOf(question)}`] = rewardPerResponse
    
    const taskType = question.questionType || 'short_text'
    if (!perTaskTypeRewards[taskType]) {
      perTaskTypeRewards[taskType] = await calculateRewardPerTaskType(taskType, currency)
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

/**
 * Get suggested reward levels based on complexity
 */
export function getSuggestedRewardLevels(
  currency: CurrencyType = 'USD'
): Record<string, { min: number; max: number; recommended: number }> {
  const currencyMultiplier = COST_OF_LIVING_MULTIPLIERS[currency]

  return {
    'easy': {
      min: BASE_REWARD_ZAR * 0.5 * currencyMultiplier,
      max: BASE_REWARD_ZAR * 1.5 * currencyMultiplier,
      recommended: BASE_REWARD_ZAR * 1.0 * currencyMultiplier,
    },
    'medium': {
      min: BASE_REWARD_ZAR * 1.0 * currencyMultiplier,
      max: BASE_REWARD_ZAR * 2.5 * currencyMultiplier,
      recommended: BASE_REWARD_ZAR * 1.5 * currencyMultiplier,
    },
    'hard': {
      min: BASE_REWARD_ZAR * 1.5 * currencyMultiplier,
      max: BASE_REWARD_ZAR * 4.0 * currencyMultiplier,
      recommended: BASE_REWARD_ZAR * 2.5 * currencyMultiplier,
    },
  }
}

