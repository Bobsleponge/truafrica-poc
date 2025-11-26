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
          needs_review: body.flag !== undefined ? body.flag : true,
          needs_question_design: body.needs_question_design || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        campaign,
        message: body.flag ? 'Campaign flagged for review' : 'Campaign flag removed',
      })
    } catch (error: any) {
      console.error('Error flagging campaign:', error)
      return NextResponse.json(
        { error: 'Failed to flag campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}



