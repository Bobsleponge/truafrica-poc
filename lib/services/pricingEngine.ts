/**
 * Pricing Engine Service
 * Main service for calculating campaign pricing using pricing rules from database
 */

import { createClient } from '@/lib/supabase/server'
import {
  calculatePricingBreakdown,
  calculateTotalCost,
  calculateTotalPrice,
  calculateMargin,
  validateMarginTarget,
  type PricingBreakdown,
  type PricingFactors,
} from '@/lib/utils/pricingCalculators'
import type { QuestionType, DifficultyLevel } from '@/types/database'

export interface CampaignPricingRequest {
  questions: Array<{
    questionType: QuestionType
    complexityLevel: DifficultyLevel
    requiredResponses: number
  }>
  urgency: 'standard' | 'express'
  targetCountries: string[]
  demographicFilterCount: number
}

export interface CampaignPricingResult {
  totalCost: number
  totalRevenue: number
  totalMargin: number
  marginPercentage: number
  breakdown: Array<{
    questionType: QuestionType
    complexityLevel: DifficultyLevel
    requiredResponses: number
    costPerAnswer: number
    pricePerAnswer: number
    totalCost: number
    totalPrice: number
    margin: number
    marginPercentage: number
  }>
  validation: {
    isValid: boolean
    message: string
  }
  currency: string
}

/**
 * Get pricing rules from database with enhanced multipliers from config tables
 */
async function getPricingRules(): Promise<
  Map<QuestionType, { basePrice: number; baseCost: number; multipliers: Record<string, any> }>
> {
  const supabase = await createClient()
  
  // Get base pricing rules
  const { data: rules, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching pricing rules:', error)
    throw new Error('Failed to fetch pricing rules')
  }

  // Get complexity configurations
  const { data: complexityConfigs } = await supabase
    .from('complexity_configurations')
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

  // Build complexity multipliers map
  const complexityMultipliers: Record<string, number> = {}
  complexityConfigs?.forEach(config => {
    complexityMultipliers[config.difficulty_level] = Number(config.multiplier_value)
  })

  // Build cost of living multipliers map
  const colMultiplierMap: Record<string, number> = {}
  colMultipliers?.forEach(mult => {
    const key = `${mult.country_code}_${mult.currency}`
    colMultiplierMap[key] = Number(mult.multiplier)
  })

  // Build task type cost multipliers map
  const taskTypeCostMultipliers: Record<string, number> = {}
  taskTypeConfigs?.forEach(config => {
    taskTypeCostMultipliers[config.task_type] = Number(config.base_cost_multiplier)
  })

  const rulesMap = new Map<
    QuestionType,
    { basePrice: number; baseCost: number; multipliers: Record<string, any> }
  >()

  for (const rule of rules || []) {
    // Merge multipliers from config tables
    const multipliers = {
      ...(rule.multiplier_factors || {}),
      complexity: complexityMultipliers,
      costOfLiving: colMultiplierMap,
      taskType: taskTypeCostMultipliers,
    }

    // Apply task type cost multiplier to base cost
    const taskTypeMultiplier = taskTypeCostMultipliers[rule.question_type] || 1.0
    const adjustedBaseCost = Number(rule.base_cost_per_answer) * taskTypeMultiplier

    rulesMap.set(rule.question_type, {
      basePrice: Number(rule.base_price_per_answer),
      baseCost: adjustedBaseCost,
      multipliers,
    })
  }

  return rulesMap
}

/**
 * Calculate pricing for a campaign
 */
export async function calculateCampaignPricing(
  request: CampaignPricingRequest
): Promise<CampaignPricingResult> {
  const pricingRules = await getPricingRules()
  const breakdown: CampaignPricingResult['breakdown'] = []
  let totalCost = 0
  let totalRevenue = 0

  // Calculate pricing for each question
  for (const question of request.questions) {
    const rule = pricingRules.get(question.questionType)

    if (!rule) {
      throw new Error(
        `No pricing rule found for question type: ${question.questionType}`
      )
    }

    const factors: PricingFactors = {
      questionType: question.questionType,
      complexityLevel: question.complexityLevel,
      urgency: request.urgency,
      targetCountry: request.targetCountries[0], // Use first country for now
      demographicFilterCount: request.demographicFilterCount,
      requiredResponses: question.requiredResponses,
    }

    const pricing = calculatePricingBreakdown(
      rule.baseCost,
      rule.basePrice,
      rule.multipliers,
      factors
    )

    breakdown.push({
      questionType: question.questionType,
      complexityLevel: question.complexityLevel,
      requiredResponses: question.requiredResponses,
      costPerAnswer: pricing.totalCost / question.requiredResponses,
      pricePerAnswer: pricing.totalPrice / question.requiredResponses,
      totalCost: pricing.totalCost,
      totalPrice: pricing.totalPrice,
      margin: pricing.margin,
      marginPercentage: pricing.marginPercentage,
    })

    totalCost += pricing.totalCost
    totalRevenue += pricing.totalPrice
  }

  const { margin, marginPercentage } = calculateMargin(totalRevenue, totalCost)
  const validation = validateMarginTarget(marginPercentage)

  return {
    totalCost,
    totalRevenue,
    totalMargin: margin,
    marginPercentage,
    breakdown,
    validation,
    currency: 'USD', // TODO: Make this configurable
  }
}

/**
 * Store pricing snapshot for a campaign
 */
export async function storePricingSnapshot(
  campaignId: string,
  pricingResult: CampaignPricingResult
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('campaign_pricing_snapshots').insert({
    campaign_id: campaignId,
    estimated_total_cost: pricingResult.totalCost,
    estimated_total_revenue: pricingResult.totalRevenue,
    estimated_margin: pricingResult.marginPercentage,
    currency: pricingResult.currency,
    breakdown: {
      breakdown: pricingResult.breakdown,
      validation: pricingResult.validation,
    },
  })

  if (error) {
    console.error('Error storing pricing snapshot:', error)
    throw new Error('Failed to store pricing snapshot')
  }
}

/**
 * Get default pricing rules (fallback if database rules not available)
 */
export function getDefaultPricingRules(): Map<
  QuestionType,
  { basePrice: number; baseCost: number; multipliers: Record<string, any> }
> {
  const rules = new Map()

  // Default pricing for each question type
  rules.set('open_text', {
    basePrice: 2.0,
    baseCost: 1.2,
    multipliers: {
      complexity: { easy: 1.0, medium: 1.3, hard: 1.6 },
      urgency: { standard: 1.0, express: 1.3 },
      country: { default: 1.0 },
    },
  })

  rules.set('rating', {
    basePrice: 1.5,
    baseCost: 0.9,
    multipliers: {
      complexity: { easy: 1.0, medium: 1.2, hard: 1.4 },
      urgency: { standard: 1.0, express: 1.2 },
      country: { default: 1.0 },
    },
  })

  rules.set('multiple_choice', {
    basePrice: 1.5,
    baseCost: 0.9,
    multipliers: {
      complexity: { easy: 1.0, medium: 1.2, hard: 1.4 },
      urgency: { standard: 1.0, express: 1.2 },
      country: { default: 1.0 },
    },
  })

  rules.set('audio', {
    basePrice: 3.0,
    baseCost: 1.8,
    multipliers: {
      complexity: { easy: 1.0, medium: 1.4, hard: 1.8 },
      urgency: { standard: 1.0, express: 1.4 },
      country: { default: 1.0 },
    },
  })

  return rules
}


