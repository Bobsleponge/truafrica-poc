// Extended types for the 20-step campaign builder

export type CampaignMode = 'client_mode' | 'internal_mode'
export type ApprovalStatus = 'draft' | 'internal_review' | 'client_review' | 'approved' | 'locked'
export type CollaboratorRole = 'owner' | 'editor' | 'viewer'
export type InHouseCampaignType = 'translation' | 'onboarding' | 'feedback'
export type DataSensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted'
export type RewardDistributionMethod = 'airtime' | 'data_voucher' | 'mobile_money' | 'cashback' | 'points'
export type CurrencyType = 'ZAR' | 'KES' | 'NGN' | 'USD'
export type ExtendedQuestionType = 
  | 'rating' 
  | 'multiple_choice' 
  | 'open_text' 
  | 'audio'
  | 'single_choice'
  | 'short_text'
  | 'long_text'
  | 'rating_scale'
  | 'comparison'
  | 'image_classification'
  | 'video'

export interface CampaignBuilderData {
  // Step 1: Company & Contact Details
  companyName?: string
  industry?: string
  contactDetails?: {
    email?: string
    phone?: string
    address?: string
    contactPerson?: string
  }
  regionsOfOperation?: string[]

  // Step 2: Data & Compliance
  dataSensitivityLevel?: DataSensitivityLevel
  ndaStatus?: boolean
  internalOwnerId?: string

  // Step 3: Timeline Preferences
  preferredTimelines?: {
    startDate?: string
    endDate?: string
    urgency?: 'standard' | 'express'
    estimatedDuration?: string
  }

  // Step 4: Primary Goal
  primaryGoal?: string
  primaryGoalType?: 'classification' | 'behavioural_modelling' | 'validation' | 'dataset_creation' | 'fine_tuning' | 'other'

  // Step 5: Secondary Goals & Use Case
  secondaryGoals?: string[]
  useCaseDescription?: string

  // Step 6: AI Technical Requirements
  aiTechnicalRequirements?: {
    embedding?: boolean
    fineTuning?: boolean
    supervisedTasks?: boolean
    other?: string
  }
  dataModality?: ('text' | 'audio' | 'image' | 'video' | 'behavioural')[]
  targetAccuracy?: number
  datasetSizeRequirements?: number

  // Step 7: Geographic Targeting
  targetCountries?: string[]
  targetProvinces?: Record<string, string[]> // {country: [provinces]}
  urbanRural?: ('urban' | 'rural' | 'both')[]

  // Step 8: Demographics
  ageBracket?: {
    min?: number
    max?: number
  }
  occupation?: string[]
  languages?: string[]
  dialects?: Record<string, string[]> // {language: [dialects]}

  // Step 9: Exclusions & Compliance
  exclusions?: string[]
  specialRequirements?: string
  popiaCompliant?: boolean

  // Step 10-13: Questions
  questions?: CampaignQuestionData[]
  questionTemplates?: string[] // Template IDs used
  branchingRules?: Record<string, any> // Question ID -> branching rules

  // Step 14-15: Rewards
  rewardConfiguration?: {
    currency?: CurrencyType
    distributionMethod?: RewardDistributionMethod
    perQuestionRewards?: Record<string, number>
    perTaskTypeRewards?: Record<string, number>
    minPayout?: number
    maxPayout?: number
  }
  rewardBudget?: number
  payoutPer1000Responses?: number

  // Step 16: Campaign Scale
  numberOfRespondents?: number
  quotasPerDemographic?: Record<string, number>
  responseTimeframe?: {
    startDate?: string
    endDate?: string
  }
  expectedCompletionTime?: number // minutes per respondent

  // Step 17: Quality Control
  qualityRules?: {
    validationLayers?: string[]
    geoVerification?: boolean
    duplicateDetection?: boolean
    aiScoringEnabled?: boolean
    disqualificationRules?: Record<string, any>
    confidenceThreshold?: number
  }

  // Step 18: Pricing
  pricing?: {
    setupFee?: number
    perResponseFee?: number
    rewardBudget?: number
    validationFee?: number
    analyticsFee?: number
    fineTuningFee?: number
    totalCost?: number
    margin?: number
    marginPercentage?: number
  }

  // Step 19-20: Summary & Approval
  campaignSummary?: string
  operationalRisks?: string[]
  mitigations?: string[]
  recommendedDatasetSchema?: Record<string, any>
  approvalStatus?: ApprovalStatus
  campaignMode?: CampaignMode
}

export interface CampaignQuestionData {
  id?: string
  content?: string
  questionType?: ExtendedQuestionType
  options?: string[] // For multiple choice, single choice
  fieldId?: string
  complexityLevel?: 'easy' | 'medium' | 'hard'
  requiredResponses?: number
  rewardValue?: number
  branchingRules?: Record<string, any>
  validationType?: 'majority_voting' | 'text_similarity' | 'ml_confidence' | 'human_validator'
  comparisonConfig?: Record<string, any>
  imageConfig?: Record<string, any>
  audioConfig?: Record<string, any>
  videoConfig?: Record<string, any>
}

export interface CampaignVersion {
  id: string
  campaign_id: string
  version_number: number
  data: CampaignBuilderData
  created_by: string
  created_at: string
  notes?: string
}

export interface CampaignCollaborator {
  id: string
  campaign_id: string
  user_id: string
  role: CollaboratorRole
  last_active_at: string
  created_at: string
}

export interface CampaignApproval {
  id: string
  campaign_id: string
  status: ApprovalStatus
  reviewed_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface QuestionTemplate {
  id: string
  sector: string
  question_type: ExtendedQuestionType
  content: string
  options: string[]
  metadata: Record<string, any>
  is_internal: boolean
  created_at: string
  updated_at: string
}

export interface RewardConfiguration {
  id: string
  campaign_id: string
  currency: CurrencyType
  distribution_method: RewardDistributionMethod
  min_payout?: number
  max_payout?: number
  per_question_rewards: Record<string, number>
  per_task_type_rewards: Record<string, number>
  total_budget?: number
  payout_per_1000_responses?: number
  created_at: string
  updated_at: string
}

export interface CampaignQualityRules {
  id: string
  campaign_id: string
  validation_layers: Record<string, any>
  geo_verification: boolean
  duplicate_detection: boolean
  ai_scoring_enabled: boolean
  disqualification_rules: Record<string, any>
  confidence_threshold: number
  created_at: string
  updated_at: string
}

export interface InHouseCampaign {
  id: string
  type: InHouseCampaignType
  target_language?: string
  status: 'draft' | 'running' | 'completed' | 'archived'
  metadata: Record<string, any>
  campaign_id?: string
  created_by: string
  created_at: string
  updated_at: string
}



