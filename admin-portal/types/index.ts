/**
 * Shared types for the admin portal
 * These types represent the data structures used throughout the admin portal
 */

export type UserRole = 'platform_admin' | 'client' | 'team' | 'contributor'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  last_login?: string
  client_id?: string
  team_id?: string
  metadata?: Record<string, unknown>
}

export interface PlatformAdmin extends User {
  role: 'platform_admin'
}

export interface Client {
  id: string
  name: string
  contact_email: string
  contact_phone?: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at?: string
  metadata?: Record<string, unknown>
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

export interface Campaign {
  id: string
  name: string
  client_id: string
  status: CampaignStatus
  type?: string
  created_at: string
  updated_at?: string
  started_at?: string
  completed_at?: string
  metadata?: Record<string, unknown>
  // Metrics
  impressions?: number
  responses?: number
  rewards_distributed?: number
  total_budget?: number
}

export interface AnalyticsMetrics {
  // User metrics
  totalUsers: number
  totalClients: number
  totalCampaigns: number
  activeCampaigns: number
  totalContributors: number
  
  // Growth metrics
  userGrowth: TimeSeriesData[]
  campaignActivity: TimeSeriesData[]
  rewardDistribution: TimeSeriesData[]
  
  // Engagement metrics
  contributorParticipation: TimeSeriesData[]
  clientEngagement: TimeSeriesData[]
  
  // Geographic data (if available)
  geographicInsights?: GeographicData[]
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface GeographicData {
  region: string
  country?: string
  users: number
  campaigns: number
  rewards: number
}

export interface PlatformSettings {
  id: string
  reward_settings: {
    default_reward_amount?: number
    reward_currency?: string
    min_reward?: number
    max_reward?: number
  }
  system_toggles: {
    allow_new_registrations?: boolean
    maintenance_mode?: boolean
    enable_rewards?: boolean
  }
  internal_notes?: string
  updated_at: string
  updated_by: string
}



