/**
 * Extended Pricing Service
 * Full pricing calculator with all fee components
 */

import { calculateCampaignPricing, type CampaignPricingRequest, type CampaignPricingResult } from './pricingEngine'
import type { CampaignQuestionData } from '@/types/campaign-builder'

export interface FullPricingRequest {
  questions: CampaignQuestionData[]
  numberOfRespondents: number
  rewardBudget: number
  urgency?: 'standard' | 'express'
  targetCountries?: string[]
  qualityRules?: {
    validationLayers?: string[]
    geoVerification?: boolean
    duplicateDetection?: boolean
    aiScoringEnabled?: boolean
  }
  analyticsDashboard?: boolean
  fineTuningDataset?: boolean
}

export interface FullPricingResult {
  setupFee: number
  perResponseFee: number
  rewardBudget: number
  validationFee: number
  analyticsFee: number
  fineTuningFee: number
  totalCost: number
  totalPrice: number
  margin: number
  marginPercentage: number
  validation: {
    isValid: boolean
    message: string
  }
  suggestedDiscount?: {
    min: number
    max: number
  }
}

// Base fees (in USD)
const BASE_SETUP_FEE = 500.0
const BASE_VALIDATION_FEE_PER_RESPONDENT = 0.50
const BASE_ANALYTICS_FEE = 200.0
const BASE_FINE_TUNING_FEE = 1000.0

/**
 * Calculate setup fee
 */
export function calculateSetupFee(
  urgency: 'standard' | 'express' = 'standard'
): number {
  const multiplier = urgency === 'express' ? 1.3 : 1.0
  return BASE_SETUP_FEE * multiplier
}

/**
 * Calculate per-response fee
 */
export async function calculatePerResponseFee(
  request: CampaignPricingRequest
): Promise<number> {
  const pricing = await calculateCampaignPricing(request)
  const totalResponses = request.questions.reduce(
    (sum, q) => sum + q.requiredResponses,
    0
  )
  return totalResponses > 0 ? pricing.totalPrice / totalResponses : 0
}

/**
 * Calculate validation fee
 */
export function calculateValidationFee(
  numberOfRespondents: number,
  qualityRules?: FullPricingRequest['qualityRules']
): number {
  let baseFee = BASE_VALIDATION_FEE_PER_RESPONDENT * numberOfRespondents

  // Add multipliers for additional validation layers
  if (qualityRules?.validationLayers) {
    const layerCount = qualityRules.validationLayers.length
    if (layerCount > 2) {
      baseFee *= 1.2 // 20% increase for 3+ layers
    }
    if (layerCount > 3) {
      baseFee *= 1.1 // Additional 10% for 4+ layers
    }
  }

  if (qualityRules?.geoVerification) {
    baseFee *= 1.15 // 15% increase for geo-verification
  }

  if (qualityRules?.aiScoringEnabled) {
    baseFee *= 1.25 // 25% increase for AI scoring
  }

  return baseFee
}

/**
 * Calculate analytics dashboard fee
 */
export function calculateAnalyticsFee(
  includeAnalytics: boolean = false
): number {
  return includeAnalytics ? BASE_ANALYTICS_FEE : 0
}

/**
 * Calculate fine-tuning and dataset packaging fee
 */
export function calculateFineTuningFee(
  includeFineTuning: boolean = false,
  datasetSize?: number
): number {
  if (!includeFineTuning) return 0

  let fee = BASE_FINE_TUNING_FEE

  // Scale based on dataset size
  if (datasetSize) {
    if (datasetSize > 10000) {
      fee *= 1.5 // 50% increase for large datasets
    }
    if (datasetSize > 50000) {
      fee *= 1.3 // Additional 30% for very large datasets
    }
  }

  return fee
}

/**
 * Calculate total price with all components
 */
export async function calculateTotalPrice(
  request: FullPricingRequest
): Promise<FullPricingResult> {
  const urgency = request.urgency || 'standard'

  // Convert questions to pricing request format
  const pricingRequest: CampaignPricingRequest = {
    questions: request.questions.map(q => ({
      questionType: (q.questionType || 'open_text') as any,
      complexityLevel: (q.complexityLevel || 'easy') as any,
      requiredResponses: q.requiredResponses || 10,
    })),
    urgency,
    targetCountries: request.targetCountries || [],
    demographicFilterCount: 0, // Calculate from target demo if needed
  }

  // Calculate base pricing
  const basePricing = await calculateCampaignPricing(pricingRequest)

  // Calculate all fees
  const setupFee = calculateSetupFee(urgency)
  const perResponseFee = await calculatePerResponseFee(pricingRequest)
  const validationFee = calculateValidationFee(
    request.numberOfRespondents,
    request.qualityRules
  )
  const analyticsFee = calculateAnalyticsFee(request.analyticsDashboard)
  const fineTuningFee = calculateFineTuningFee(
    request.fineTuningDataset,
    request.qualityRules?.validationLayers?.length
  )

  // Calculate costs
  const operationalCost = basePricing.totalCost
  const rewardCost = request.rewardBudget
  const totalCost = operationalCost + rewardCost + validationFee

  // Calculate revenue
  const baseRevenue = basePricing.totalRevenue
  const totalPrice = baseRevenue + setupFee + analyticsFee + fineTuningFee

  // Calculate margin
  const margin = totalPrice - totalCost
  const marginPercentage = totalPrice > 0 ? (margin / totalPrice) * 100 : 0

  // Suggest discount range
  let suggestedDiscount
  if (request.numberOfRespondents > 5000) {
    suggestedDiscount = { min: 5, max: 15 }
  } else if (request.numberOfRespondents > 1000) {
    suggestedDiscount = { min: 3, max: 10 }
  } else {
    suggestedDiscount = { min: 0, max: 5 }
  }

  return {
    setupFee,
    perResponseFee,
    rewardBudget: request.rewardBudget,
    validationFee,
    analyticsFee,
    fineTuningFee,
    totalCost,
    totalPrice,
    margin,
    marginPercentage,
    validation: {
      isValid: marginPercentage >= 20,
      message: marginPercentage >= 30
        ? 'Excellent margin target achieved'
        : marginPercentage >= 20
        ? 'Good margin target achieved'
        : 'Margin below target (recommended: 20%+)',
    },
    suggestedDiscount,
  }
}



