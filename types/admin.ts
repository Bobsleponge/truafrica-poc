// Admin Dashboard Types

export type AdminEventType = 
  | 'user_created'
  | 'user_updated'
  | 'answer_submitted'
  | 'question_created'
  | 'campaign_updated'
  | 'campaign_created'
  | 'flagged_answer'
  | 'api_usage'
  | 'validation_completed'

export interface AdminEvent {
  type: AdminEventType
  timestamp: string
  data: Record<string, any>
}

export interface SystemStats {
  users: {
    total: number
    contributors: number
    clientOwners: number
    clientUsers: number
    teamAccounts: number
    platformAdmins: number
    admins: number // Legacy
    newToday: number
  }
  campaigns: {
    total: number
    draft: number
    running: number
    completed: number
    archived: number
  }
  questions: {
    total: number
    active: number
    completed: number
    archived: number
  }
  answers: {
    total: number
    pending: number
    validated: number
    flagged: number
    averageConsensus: number
    averageValidationConfidence: number
  }
  rewards: {
    total: number
    pending: number
    awarded: number
    redeemed: number
    totalValue: number
  }
  api: {
    totalRequests: number
    requestsLastHour: number
    activeKeys: number
    rateLimitHits: number
  }
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  database: {
    connected: boolean
    responseTime: number
  }
  api: {
    averageResponseTime: number
    errorRate: number
  }
  activeCampaigns: number
  pendingFlaggedAnswers: number
  recentErrors: Array<{
    message: string
    timestamp: string
    endpoint?: string
  }>
}

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'contributor' | 'client_owner' | 'client_user' | 'team_account' | 'platform_admin' | 'admin'
  sub_role?: string | null
  country: string | null
  trust_score: number | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  languages?: string[]
  expertise_fields?: string[]
}

export interface AdminCampaign {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'running' | 'completed' | 'archived'
  client_id: string
  client_name: string
  total_questions: number
  total_responses: number
  required_responses: number
  completion_rate: number
  created_at: string
  updated_at: string
}

export interface AdminQuestion {
  id: string
  content: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  status: 'active' | 'completed' | 'archived'
  client_id: string // Renamed from company_id
  client_name: string // Renamed from company_name
  campaign_id: string | null
  campaign_name: string | null
  answer_count: number
  average_consensus: number | null
  average_validation_confidence: number | null
  created_at: string
  updated_at: string
  // Legacy fields for backward compatibility
  company_id?: string
  company_name?: string
}

export interface AdminAnswer {
  id: string
  answer_text: string
  question_id: string
  question_content: string
  contributor_id: string
  contributor_name: string
  contributor_trust_score: number
  consensus_score: number | null
  validation_confidence_score: number | null
  correct: boolean | null
  is_flagged: boolean
  flagged_reason: string | null
  created_at: string
}

export interface SecurityEvent {
  id: string
  type: 'api_request' | 'auth_failure' | 'rate_limit' | 'suspicious_activity'
  api_key_id: string | null
  api_key_name: string | null
  endpoint: string | null
  method: string | null
  status_code: number | null
  user_id: string | null
  user_email: string | null
  ip_address: string | null
  timestamp: string
  metadata: Record<string, any>
}

export interface ApiUsageStats {
  totalRequests: number
  requestsLastHour: number
  requestsLast24Hours: number
  topEndpoints: Array<{
    endpoint: string
    count: number
    avgResponseTime: number
  }>
  activeKeys: number
  rateLimitHits: number
  errors: number
  errorsLast24Hours: number
}

export interface AdminDashboardData {
  stats: SystemStats
  health: SystemHealth
  recentActivity: AdminEvent[]
}

