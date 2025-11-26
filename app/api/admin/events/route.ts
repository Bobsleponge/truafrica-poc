import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { AdminEvent } from '@/types/admin'

/**
 * GET /api/admin/events
 * Server-Sent Events stream for real-time admin updates
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const auth = await requireAdmin(request)
  if (!auth.isAdmin) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data))
      }

      send('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n')

      // Set up Supabase real-time subscriptions
      const supabase = await createClient()

      // Subscribe to users table
      const usersChannel = supabase
        .channel('admin-users')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
          },
          (payload) => {
            const event: AdminEvent = {
              type: payload.eventType === 'INSERT' ? 'user_created' : 'user_updated',
              timestamp: new Date().toISOString(),
              data: payload.new || payload.old,
            }
            send(`data: ${JSON.stringify(event)}\n\n`)
          }
        )
        .subscribe()

      // Subscribe to answers table
      const answersChannel = supabase
        .channel('admin-answers')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'answers',
          },
          (payload) => {
            const event: AdminEvent = {
              type: 'answer_submitted',
              timestamp: new Date().toISOString(),
              data: payload.new,
            }
            send(`data: ${JSON.stringify(event)}\n\n`)
          }
        )
        .subscribe()

      // Subscribe to questions table
      const questionsChannel = supabase
        .channel('admin-questions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'questions',
          },
          (payload) => {
            const event: AdminEvent = {
              type: 'question_created',
              timestamp: new Date().toISOString(),
              data: payload.new,
            }
            send(`data: ${JSON.stringify(event)}\n\n`)
          }
        )
        .subscribe()

      // Subscribe to campaigns table
      const campaignsChannel = supabase
        .channel('admin-campaigns')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'campaigns',
          },
          (payload) => {
            const event: AdminEvent = {
              type: payload.eventType === 'INSERT' ? 'campaign_created' : 'campaign_updated',
              timestamp: new Date().toISOString(),
              data: payload.new || payload.old,
            }
            send(`data: ${JSON.stringify(event)}\n\n`)
          }
        )
        .subscribe()

      // Subscribe to flagged_answers table
      const flaggedChannel = supabase
        .channel('admin-flagged')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'flagged_answers',
          },
          (payload) => {
            const event: AdminEvent = {
              type: 'flagged_answer',
              timestamp: new Date().toISOString(),
              data: payload.new,
            }
            send(`data: ${JSON.stringify(event)}\n\n`)
          }
        )
        .subscribe()

      // Subscribe to api_usage_events table (throttled)
      let apiEventBuffer: any[] = []
      const apiEventInterval = setInterval(() => {
        if (apiEventBuffer.length > 0) {
          const event: AdminEvent = {
            type: 'api_usage',
            timestamp: new Date().toISOString(),
            data: {
              count: apiEventBuffer.length,
              events: apiEventBuffer,
            },
          }
          send(`data: ${JSON.stringify(event)}\n\n`)
          apiEventBuffer = []
        }
      }, 5000) // Batch API events every 5 seconds

      const apiChannel = supabase
        .channel('admin-api')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'api_usage_events',
          },
          (payload) => {
            apiEventBuffer.push(payload.new)
          }
        )
        .subscribe()

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        send(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`)
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(apiEventInterval)
        clearInterval(heartbeatInterval)
        usersChannel.unsubscribe()
        answersChannel.unsubscribe()
        questionsChannel.unsubscribe()
        campaignsChannel.unsubscribe()
        flaggedChannel.unsubscribe()
        apiChannel.unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  })
}



