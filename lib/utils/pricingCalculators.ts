/**
 * Pricing calculation utilities
 * Handles cost, price, and margin calculations for campaigns
 */

import type { QuestionType, DifficultyLevel } from '@/types/database'

export interface PricingBreakdown {
  baseCost: number
  basePrice: number
  multipliers: {
    complexity: number
    urgency: number
    country: number
    demographicFilters: number
  }
  totalCost: number
  totalPrice: number
  margin: number
  marginPercentage: number
}

export interface PricingFactors {
  questionType: QuestionType
  complexityLevel: DifficultyLevel
  urgency: 'standard' | 'express'
  targetCountry?: string
  demographicFilterCount: number
  requiredResponses: number
}

/**
 * Calculate cost per answer (reward cost + processing overhead)
 */
export function calculateCostPerAnswer(
  baseCost: number,
  factors: PricingFactors
): number {
  let cost = baseCost

  // Complexity multiplier (harder questions cost more to reward)
  const complexityMultipliers: Record<DifficultyLevel, number> = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
  }
  cost *= complexityMultipliers[factors.complexityLevel] || 1.0

  // Processing overhead (fixed per answer)
  const processingOverhead = 0.10 // $0.10 per answer for processing
  cost += processingOverhead

  return Math.round(cost * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate price per answer (base price × multipliers)
 */
export function calculatePricePerAnswer(
  basePrice: number,
  multipliers: Record<string, any>,
  factors: PricingFactors
): number {
  let price = basePrice

  // Apply multipliers from pricing rules
  if (multipliers.complexity) {
    const complexityMultiplier =
      multipliers.complexity[factors.complexityLevel] || 1.0
    price *= complexityMultiplier
  }

  if (multipliers.urgency) {
    const urgencyMultiplier = multipliers.urgency[factors.urgency] || 1.0
    price *= urgencyMultiplier
  }

  if (multipliers.country && factors.targetCountry) {
    const countryMultiplier =
      multipliers.country[factors.targetCountry] || 1.0
    price *= countryMultiplier
  }

  // Demographic filter multiplier (more filters = higher price)
  const filterMultiplier = 1 + factors.demographicFilterCount * 0.1
  price *= filterMultiplier

  return Math.round(price * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate total cost for a campaign
 */
export function calculateTotalCost(
  costPerAnswer: number,
  requiredResponses: number
): number {
  return Math.round(costPerAnswer * requiredResponses * 100) / 100
}

/**
 * Calculate total price for a campaign
 */
export function calculateTotalPrice(
  pricePerAnswer: number,
  requiredResponses: number
): number {
  return Math.round(pricePerAnswer * requiredResponses * 100) / 100
}

/**
 * Calculate margin and margin percentage
 */
export function calculateMargin(totalPrice: number, totalCost: number): {
  margin: number
  marginPercentage: number
} {
  const margin = totalPrice - totalCost
  const marginPercentage = totalPrice > 0 ? (margin / totalPrice) * 100 : 0

  return {
    margin: Math.round(margin * 100) / 100,
    marginPercentage: Math.round(marginPercentage * 100) / 100,
  }
}

/**
 * Calculate full pricing breakdown for a campaign question
 */
export function calculatePricingBreakdown(
  baseCost: number,
  basePrice: number,
  multipliers: Record<string, any>,
  factors: PricingFactors
): PricingBreakdown {
  const costPerAnswer = calculateCostPerAnswer(baseCost, factors)
  const pricePerAnswer = calculatePricePerAnswer(basePrice, multipliers, factors)

  const totalCost = calculateTotalCost(costPerAnswer, factors.requiredResponses)
  const totalPrice = calculateTotalPrice(pricePerAnswer, factors.requiredResponses)

  const { margin, marginPercentage } = calculateMargin(totalPrice, totalCost)

  return {
    baseCost,
    basePrice,
    multipliers: {
      complexity:
        multipliers.complexity?.[factors.complexityLevel] || 1.0,
      urgency: multipliers.urgency?.[factors.urgency] || 1.0,
      country:
        multipliers.country?.[factors.targetCountry || 'default'] || 1.0,
      demographicFilters: 1 + factors.demographicFilterCount * 0.1,
    },
    totalCost,
    totalPrice,
    margin,
    marginPercentage,
  }
}

/**
 * Validate margin target (30-45% is ideal)
 */
export function validateMarginTarget(marginPercentage: number): {
  isValid: boolean
  message: string
} {
  if (marginPercentage < 0) {
    return {
      isValid: false,
      message: 'Margin is negative - price is below cost',
    }
  }
  if (marginPercentage < 30) {
    return {
      isValid: true,
      message: 'Margin is below target (30-45%)',
    }
  }
  if (marginPercentage > 45) {
    return {
      isValid: true,
      message: 'Margin is above target (30-45%) - consider reducing price',
    }
  }
  return {
    isValid: true,
    message: 'Margin is within target range (30-45%)',
  }
}




