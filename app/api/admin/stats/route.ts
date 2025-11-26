import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { getSystemStats } from '@/lib/utils/adminStats'

/**
 * GET /api/admin/stats
 * Get system-wide statistics
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const stats = await getSystemStats()
      return NextResponse.json({ success: true, stats })
    } catch (error: any) {
      console.error('Error fetching system stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch system statistics', details: error.message },
        { status: 500 }
      )
    }
  })
}



