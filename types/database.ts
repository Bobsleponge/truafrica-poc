export type UserRole = 'contributor' | 'platform_admin' | 'client_owner' | 'client_user' | 'team_account'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type RewardType = 'airtime' | 'mobile_money' | 'grocery_voucher'

export type RewardStatus = 'pending' | 'awarded' | 'redeemed'

export type QuestionType = 
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

export type CampaignStatus = 'draft' | 'running' | 'completed' | 'archived'

export type ValidationType = 'majority_voting' | 'text_similarity' | 'ml_confidence' | 'human_validator'

export type FlaggedAnswerStatus = 'pending' | 'resolved' | 'invalid'

export interface User {
  id: string
  email: string
  role: UserRole
  sub_role?: string | null // For client_user: 'Manager', 'Analyst', 'Viewer'
  client_id?: string | null // Links user to their client organization
  name: string | null
  country: string | null
  languages: string[] | null
  expertise_fields: string[] | null
  trust_score: number
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface ExpertiseField {
  id: string
  name: string
  description: string | null
  difficulty_level: DifficultyLevel
  created_at: string
}

export interface Question {
  id: string
  client_id: string // Renamed from company_id
  field_id: string
  content: string
  difficulty_level: DifficultyLevel
  status: 'active' | 'completed' | 'archived'
  // Extended fields from migration 004
  branching_rules?: Record<string, any> | null
  validation_type?: ValidationType | null
  reward_value?: number | null
  comparison_config?: Record<string, any> | null
  image_config?: Record<string, any> | null
  audio_config?: Record<string, any> | null
  video_config?: Record<string, any> | null
  options?: string[] | null
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  question_id: string
  contributor_id: string
  answer_text: string
  consensus_score: number | null
  correct: boolean | null
  validation_confidence_score: number | null
  created_at: string
}

export interface Reward {
  id: string
  contributor_id: string
  reward_type: RewardType
  value: number
  status: RewardStatus
  awarded_at: string
}

export interface Rating {
  id: string
  contributor_id: string
  question_id: string
  rating_change: number
  reason: string
  created_at: string
}

export interface ClientDashboardStats {
  client_id: string // Renamed from company_id
  total_questions: number
  answered_questions: number
  average_consensus_score: number
  average_contributor_rating: number
  created_at: string
}

export interface Campaign {
  id: string
  client_id: string
  name: string
  description: string | null
  objective: string | null
  target_countries: string[]
  target_demo: Record<string, any> | null
  status: CampaignStatus
  needs_question_design: boolean
  // Extended fields from migration 004
  company_name?: string | null
  industry?: string | null
  contact_details?: Record<string, any> | null
  regions_of_operation?: string[]
  data_sensitivity_level?: 'public' | 'internal' | 'confidential' | 'restricted'
  nda_status?: boolean
  internal_owner_id?: string | null
  preferred_timelines?: Record<string, any> | null
  primary_goal?: string | null
  secondary_goals?: string[]
  use_case_description?: string | null
  ai_technical_requirements?: Record<string, any> | null
  data_modality?: string[]
  target_accuracy?: number | null
  dataset_size_requirements?: number | null
  is_in_house?: boolean
  campaign_mode?: 'client_mode' | 'internal_mode'
  total_budget?: number | null
  reward_budget?: number | null
  setup_fee?: number | null
  per_response_fee?: number | null
  validation_fee?: number | null
  analytics_fee?: number | null
  fine_tuning_fee?: number | null
  current_version_id?: string | null
  approval_status?: 'draft' | 'internal_review' | 'client_review' | 'approved' | 'locked'
  wizard_data?: Record<string, any> | null
  wizard_step?: number
  created_at: string
  updated_at: string
}

export interface CampaignBrief {
  id: string
  campaign_id: string
  goals: string | null
  key_questions: string[]
  constraints: string | null
  languages: string[]
  budget: number | null
  timeline: string | null
  created_at: string
  updated_at: string
}

export interface CampaignQuestion {
  id: string
  campaign_id: string
  question_id: string
  question_type: QuestionType
  required_responses: number
  complexity_level: DifficultyLevel
  base_price_per_answer: number | null
  created_at: string
}

export interface PricingRule {
  id: string
  question_type: QuestionType
  base_price_per_answer: number
  base_cost_per_answer: number
  multiplier_factors: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CampaignPricingSnapshot {
  id: string
  campaign_id: string
  estimated_total_cost: number
  estimated_total_revenue: number
  estimated_margin: number
  currency: string
  breakdown: Record<string, any> | null
  created_at: string
}

export interface ApiKey {
  id: string
  client_id: string
  key_hash: string
  name: string
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
}

export interface ApiUsageEvent {
  id: string
  api_key_id: string
  endpoint: string
  method: string
  status_code: number
  created_at: string
}

export interface ValidationEvent {
  id: string
  answer_id: string
  validation_type: ValidationType
  confidence_score: number | null
  validator_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface FlaggedAnswer {
  id: string
  answer_id: string
  reason: string
  status: FlaggedAnswerStatus
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  industry: string | null
  contact_email: string | null
  billing_info: Record<string, any>
  status: 'active' | 'suspended' | 'inactive'
  created_at: string
  updated_at: string
}

export interface TeamAccount {
  id: string
  client_id: string | null // Optional assignment to specific client
  department: string | null
  permissions: Record<string, any>
  created_at: string
  updated_at: string
}

