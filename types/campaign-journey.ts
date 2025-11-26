import type { CurrencyType, RewardDistributionMethod } from './campaign-builder'

export type CampaignJourneyStepKey =
  | 'overview'
  | 'goals'
  | 'audience'
  | 'questions'
  | 'rewards'
  | 'scale'
  | 'pricing'
  | 'summary'

export type GoalModality =
  | 'behaviour'
  | 'reasoning'
  | 'audio'
  | 'image'
  | 'validation'
  | 'fine_tuning'

export type QuestionKind =
  | 'mcq'
  | 'single_choice'
  | 'short_text'
  | 'long_text'
  | 'rating'
  | 'audio'
  | 'image'
  | 'video'

export type CampaignJourneyMode = 'client' | 'internal'

// Standard points system: 10 points = $0.10 (1 point = $0.01)
export const POINTS_TO_USD_RATE = 0.01
export const POINTS_PER_DOLLAR = 100

export interface CampaignOverview {
  campaignName?: string
  companyName?: string
  industry?: string
  oneLineObjective?: string
  internalOwner?: string
}

export interface GoalFollowUp {
  datasetDescription?: string
  inputs?: string[]
  outputs?: string[]
  annotationDepth?: 'light' | 'medium' | 'deep'
  validationNeeds?: string
}

export interface CampaignGoals {
  primaryGoal?: GoalModality
  secondaryGoals: GoalModality[]
  truafricaBuildsQuestions: boolean
  modalityDetails: Record<GoalModality, GoalFollowUp>
}

export interface CampaignAudience {
  country?: string
  region?: string
  ageRange?: {
    preset?: 'all_adults' | '18_24' | '25_34' | '35_44' | '45_plus' | 'custom'
    min?: number
    max?: number
  }
  languages?: string[]
  localePreference?: 'none' | 'urban' | 'rural' | 'mixed'
  estimatedVolume?: 'small' | 'medium' | 'large'
}

export interface CampaignQuestion {
  id: string
  title: string
  description?: string
  type: QuestionKind
  options?: string[]
  reward?: number
  branching?: { condition?: string; nextQuestionId?: string }
  complexity?: 'simple' | 'balanced' | 'complex'
  required?: boolean
}

export interface RewardSettings {
  // Standard points system - contributors earn points and choose how to redeem them
  // Points are calculated automatically based on question complexity
  computedPointsPerQuestion?: number
  computedPointsPerRespondent?: number
  computedTotalPoints?: number
  // Legacy fields kept for backward compatibility but not used in UI
  rewardType?: RewardDistributionMethod
  currency?: CurrencyType
  fairnessMode?: 'low' | 'balanced' | 'premium'
  customValue?: number
  network?: string
  computedRewardPerQuestion?: number
  computedRewardPerRespondent?: number
  computedTotalBudget?: number
}

export interface ScaleSettings {
  respondents?: number
  quotas: Record<string, number>
  timeframe?: { start?: string; end?: string }
  validationStrictness: 'low' | 'medium' | 'high'
  autoGeoVerification: boolean
  autoDuplicateDetection: boolean
  aiQualityScoring: boolean
  autoDisqualification: boolean
}

export interface PricingBreakdown {
  setupFee: number
  perResponseFee: number
  rewardBudget: number
  validationFee: number
  analyticsFee: number
  fineTuningFee: number
  internalMargin: number
  recommendedDiscount: number
  total: number
}

export interface PricingSettings {
  hidePricing: boolean
  breakdown: PricingBreakdown
  notes?: string
}

export interface CampaignJourneyData {
  overview: CampaignOverview
  goals: CampaignGoals
  audience: CampaignAudience
  questions: CampaignQuestion[]
  rewards: RewardSettings
  scale: ScaleSettings
  pricing: PricingSettings
}

export interface BranchingState {
  showRegion: boolean
  showLanguages: boolean
  disableAgeCustomRange: boolean
  requireNetwork: boolean
  autoLoadedRegions: string[]
  shouldShowQuestionBuilder: boolean
  shouldShowPricing: boolean
  preferredQuestionTypes: QuestionKind[]
  disabledQuestionTypes: QuestionKind[]
  rewardSuggestionRange: { min: number; max: number }
}


