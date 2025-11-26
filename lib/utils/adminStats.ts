import { createClient } from '@/lib/supabase/server'
import type { SystemStats, SystemHealth } from '@/types/admin'

// Simple in-memory cache with TTL (5 minutes)
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data as T
  }
  cache.delete(key)
  return null
}

function setCached(key: string, data: any) {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL,
  })
}

export async function getSystemStats(): Promise<SystemStats> {
  const cacheKey = 'system_stats'
  const cached = getCached<SystemStats>(cacheKey)
  if (cached) return cached

  const supabase = await createClient()

  // Get user counts by role
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('role, created_at')

  if (usersError) throw usersError

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const userStats = {
    total: users?.length || 0,
    contributors: users?.filter(u => u.role === 'contributor').length || 0,
    clientOwners: users?.filter(u => u.role === 'client_owner').length || 0,
    clientUsers: users?.filter(u => u.role === 'client_user').length || 0,
    teamAccounts: users?.filter(u => u.role === 'team_account').length || 0,
    platformAdmins: users?.filter(u => u.role === 'platform_admin').length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0, // Legacy admin role
    newToday: users?.filter(u => new Date(u.created_at) >= todayStart).length || 0,
  }

  // Get campaign counts by status
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('status')

  if (campaignsError) throw campaignsError

  const campaignStats = {
    total: campaigns?.length || 0,
    draft: campaigns?.filter(c => c.status === 'draft').length || 0,
    running: campaigns?.filter(c => c.status === 'running').length || 0,
    completed: campaigns?.filter(c => c.status === 'completed').length || 0,
    archived: campaigns?.filter(c => c.status === 'archived').length || 0,
  }

  // Get question counts by status
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('status')

  if (questionsError) throw questionsError

  const questionStats = {
    total: questions?.length || 0,
    active: questions?.filter(q => q.status === 'active').length || 0,
    completed: questions?.filter(q => q.status === 'completed').length || 0,
    archived: questions?.filter(q => q.status === 'archived').length || 0,
  }

  // Get answer stats
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('consensus_score, validation_confidence_score, correct')

  if (answersError) throw answersError

  const { data: flaggedAnswers } = await supabase
    .from('flagged_answers')
    .select('id')
    .eq('status', 'pending')

  const consensusScores = answers?.map(a => a.consensus_score).filter(Boolean) as number[] || []
  const validationScores = answers?.map(a => a.validation_confidence_score).filter(Boolean) as number[] || []

  const answerStats = {
    total: answers?.length || 0,
    pending: answers?.filter(a => a.correct === null).length || 0,
    validated: answers?.filter(a => a.correct !== null).length || 0,
    flagged: flaggedAnswers?.length || 0,
    averageConsensus: consensusScores.length > 0
      ? consensusScores.reduce((a, b) => a + b, 0) / consensusScores.length
      : 0,
    averageValidationConfidence: validationScores.length > 0
      ? validationScores.reduce((a, b) => a + b, 0) / validationScores.length
      : 0,
  }

  // Get reward stats
  const { data: rewards, error: rewardsError } = await supabase
    .from('rewards')
    .select('status, value')

  if (rewardsError) throw rewardsError

  const rewardStats = {
    total: rewards?.length || 0,
    pending: rewards?.filter(r => r.status === 'pending').length || 0,
    awarded: rewards?.filter(r => r.status === 'awarded').length || 0,
    redeemed: rewards?.filter(r => r.status === 'redeemed').length || 0,
    totalValue: rewards?.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) || 0,
  }

  // Get API stats
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count: apiRequestsLastHour } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo)

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id')
    .is('revoked_at', null)

  const { count: totalApiRequests } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })

  const { count: rateLimitHits } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('status_code', 429)

  const apiStats = {
    totalRequests: totalApiRequests || 0,
    requestsLastHour: apiRequestsLastHour || 0,
    activeKeys: apiKeys?.length || 0,
    rateLimitHits: rateLimitHits || 0,
  }

  const stats: SystemStats = {
    users: userStats,
    campaigns: campaignStats,
    questions: questionStats,
    answers: answerStats,
    rewards: rewardStats,
    api: apiStats,
  }

  setCached(cacheKey, stats)
  return stats
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const cacheKey = 'system_health'
  const cached = getCached<SystemHealth>(cacheKey)
  if (cached) return cached

  const supabase = await createClient()
  const startTime = Date.now()

  // Test database connection
  const { error: dbError } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  const dbResponseTime = Date.now() - startTime
  const dbConnected = !dbError

  // Get active campaigns
  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'running')

  // Get pending flagged answers
  const { count: pendingFlagged } = await supabase
    .from('flagged_answers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get recent API errors (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recentErrors } = await supabase
    .from('api_usage_events')
    .select('endpoint, created_at')
    .gte('status_code', 500)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate API error rate (last hour)
  const { count: totalRequests } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo)

  const { count: errorRequests } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo)
    .gte('status_code', 400)
    .lt('status_code', 500)

  const errorRate = totalRequests && totalRequests > 0
    ? ((errorRequests || 0) / totalRequests) * 100
    : 0

  // Calculate average API response time (simplified - would need response_time column)
  const avgResponseTime = 150 // Placeholder - would calculate from actual response times

  const health: SystemHealth = {
    status: dbConnected && errorRate < 10 ? 'healthy' : errorRate < 25 ? 'degraded' : 'down',
    database: {
      connected: dbConnected,
      responseTime: dbResponseTime,
    },
    api: {
      averageResponseTime: avgResponseTime,
      errorRate,
    },
    activeCampaigns: activeCampaigns || 0,
    pendingFlaggedAnswers: pendingFlagged || 0,
    recentErrors: (recentErrors || []).map(e => ({
      message: `Error on ${e.endpoint || 'unknown endpoint'}`,
      timestamp: e.created_at,
      endpoint: e.endpoint || undefined,
    })),
  }

  setCached(cacheKey, health)
  return health
}

