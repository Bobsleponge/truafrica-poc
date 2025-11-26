/**
 * API Key Authentication Middleware
 * Validates API keys and tracks usage
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  // Generate a secure random API key
  const prefix = 'truaf_'
  const randomBytes = crypto.randomBytes(32).toString('base64url')
  return `${prefix}${randomBytes}`
}

/**
 * Validate API key from request
 */
export async function validateApiKey(request: NextRequest): Promise<{
  isValid: boolean
  apiKeyId?: string
  clientId?: string
  error?: string
}> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: 'Missing or invalid Authorization header',
    }
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
  const keyHash = hashApiKey(apiKey)

  const supabase = await createClient()

  // Find API key by hash
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, client_id, revoked_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKeyData) {
    return {
      isValid: false,
      error: 'Invalid API key',
    }
  }

  // Check if key is revoked
  if (apiKeyData.revoked_at) {
    return {
      isValid: false,
      error: 'API key has been revoked',
    }
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id)

  return {
    isValid: true,
    apiKeyId: apiKeyData.id,
    clientId: apiKeyData.client_id,
  }
}

/**
 * Track API usage event
 */
export async function trackApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('api_usage_events').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
  })
}

/**
 * Check rate limit for API key
 * Basic implementation: 1000 requests per hour
 */
export async function checkRateLimit(apiKeyId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const supabase = await createClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Count requests in the last hour
  const { count, error } = await supabase
    .from('api_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneHourAgo)

  if (error) {
    console.error('Error checking rate limit:', error)
    return {
      allowed: true, // Fail open
      remaining: 1000,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    }
  }

  const limit = 1000
  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const allowed = used < limit

  return {
    allowed,
    remaining,
    resetAt: new Date(Date.now() + 60 * 60 * 1000),
  }
}

/**
 * API authentication middleware wrapper
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (request: NextRequest, clientId: string, apiKeyId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid || !validation.apiKeyId || !validation.clientId) {
    return NextResponse.json(
      { error: validation.error || 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(validation.apiKeyId)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit: 1000,
        resetAt: rateLimit.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    )
  }

  // Call handler
  const response = await handler(request, validation.clientId, validation.apiKeyId)

  // Track usage
  await trackApiUsage(
    validation.apiKeyId,
    new URL(request.url).pathname,
    request.method,
    response.status
  )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', '1000')
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString())

  return response
}




