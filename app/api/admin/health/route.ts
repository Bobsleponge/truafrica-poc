import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { getSystemHealth } from '@/lib/utils/adminStats'

/**
 * GET /api/admin/health
 * Get comprehensive system health metrics
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const health = await getSystemHealth()
      return NextResponse.json({ success: true, health })
    } catch (error: any) {
      console.error('Error fetching system health:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system health', details: error.message },
        { status: 500 }
      )
    }
  })
}



