import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { SecurityEvent, ApiUsageStats } from '@/types/admin'

/**
 * GET /api/admin/security
 * Get security events and API usage statistics
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const type = searchParams.get('type')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = (page - 1) * limit

      const supabase = await createClient()

      // Get API usage statistics
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { count: totalRequests } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })

      const { count: requestsLastHour } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo)

      const { count: requestsLast24Hours } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)

      const { count: rateLimitHits } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('status_code', 429)

      const { count: errors } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })
        .gte('status_code', 400)
        .lt('status_code', 500)

      const { count: errorsLast24Hours } = await supabase
        .from('api_usage_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)
        .gte('status_code', 400)
        .lt('status_code', 500)

      // Get top endpoints
      const { data: endpointData } = await supabase
        .from('api_usage_events')
        .select('endpoint, status_code, created_at')
        .gte('created_at', oneDayAgo)

      const endpointCounts: Record<string, { count: number; responseTimes: number[] }> = {}
      endpointData?.forEach(event => {
        if (!event.endpoint) return
        if (!endpointCounts[event.endpoint]) {
          endpointCounts[event.endpoint] = { count: 0, responseTimes: [] }
        }
        endpointCounts[event.endpoint].count++
        // Note: Would need response_time column for actual response times
        endpointCounts[event.endpoint].responseTimes.push(150) // Placeholder
      })

      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, data]) => ({
          endpoint,
          count: data.count,
          avgResponseTime: data.responseTimes.length > 0
            ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
            : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Get active API keys
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('id')
        .is('revoked_at', null)

      const apiStats: ApiUsageStats = {
        totalRequests: totalRequests || 0,
        requestsLastHour: requestsLastHour || 0,
        requestsLast24Hours: requestsLast24Hours || 0,
        topEndpoints,
        activeKeys: apiKeys?.length || 0,
        rateLimitHits: rateLimitHits || 0,
        errors: errors || 0,
        errorsLast24Hours: errorsLast24Hours || 0,
      }

      // Get security events (API usage events)
      let eventsQuery = supabase
        .from('api_usage_events')
        .select(`
          *,
          api_keys (
            id,
            name,
            client_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (type) {
        if (type === 'rate_limit') {
          eventsQuery = eventsQuery.eq('status_code', 429)
        } else if (type === 'error') {
          eventsQuery = eventsQuery.gte('status_code', 400).lt('status_code', 500)
        }
      }

      eventsQuery = eventsQuery.range(offset, offset + limit - 1)

      const { data: events, error: eventsError, count } = await eventsQuery

      if (eventsError) throw eventsError

      // Get user info for events
      const userIds = [...new Set((events || [])
        .map(e => e.api_keys?.client_id)
        .filter(Boolean) as string[])]

      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      const userMap = new Map((users || []).map(u => [u.id, u.email]))

      const securityEvents: SecurityEvent[] = (events || []).map(event => {
        const apiKey = Array.isArray(event.api_keys) ? event.api_keys[0] : event.api_keys
        const userEmail = apiKey?.client_id ? userMap.get(apiKey.client_id) : null

        let eventType: SecurityEvent['type'] = 'api_request'
        if (event.status_code === 429) {
          eventType = 'rate_limit'
        } else if (event.status_code === 401 || event.status_code === 403) {
          eventType = 'auth_failure'
        } else if (event.status_code >= 500) {
          eventType = 'suspicious_activity'
        }

        return {
          id: event.id,
          type: eventType,
          api_key_id: event.api_key_id,
          api_key_name: apiKey?.name || null,
          endpoint: event.endpoint,
          method: event.method,
          status_code: event.status_code,
          user_id: apiKey?.client_id || null,
          user_email: userEmail || null,
          ip_address: null, // Would need to store IP in api_usage_events
          timestamp: event.created_at,
          metadata: {},
        }
      })

      return NextResponse.json({
        success: true,
        stats: apiStats,
        events: securityEvents,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Error fetching security data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch security data', details: error.message },
        { status: 500 }
      )
    }
  })
}



