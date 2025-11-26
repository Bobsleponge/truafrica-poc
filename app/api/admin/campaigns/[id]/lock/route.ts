import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const body = await request.json()
      const supabase = await createClient()

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update({
          is_locked: body.locked !== undefined ? body.locked : true,
          approval_status: body.locked ? 'locked' : 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        campaign,
        message: body.locked ? 'Campaign locked' : 'Campaign unlocked',
      })
    } catch (error: any) {
      console.error('Error locking campaign:', error)
      return NextResponse.json(
        { error: 'Failed to lock campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}



