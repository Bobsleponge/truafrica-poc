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
      const supabase = await createClient()

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        campaign,
        message: 'Campaign archived successfully',
      })
    } catch (error: any) {
      console.error('Error archiving campaign:', error)
      return NextResponse.json(
        { error: 'Failed to archive campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}



