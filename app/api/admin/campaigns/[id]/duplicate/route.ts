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

      // Get original campaign
      const { data: original, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Create duplicate
      const { name, client_id, ...campaignData } = original
      const duplicateData = {
        ...campaignData,
        name: `${name} (Copy)`,
        status: 'draft',
        approval_status: 'draft',
        is_locked: false,
        needs_review: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: duplicate, error: createError } = await supabase
        .from('campaigns')
        .insert(duplicateData)
        .select()
        .single()

      if (createError) throw createError

      // Duplicate campaign questions if any
      const { data: questions } = await supabase
        .from('campaign_questions')
        .select('*')
        .eq('campaign_id', id)

      if (questions && questions.length > 0) {
        const duplicateQuestions = questions.map(q => ({
          ...q,
          id: undefined,
          campaign_id: duplicate.id,
          created_at: new Date().toISOString(),
        }))

        await supabase
          .from('campaign_questions')
          .insert(duplicateQuestions)
      }

      return NextResponse.json({
        success: true,
        campaign: duplicate,
        message: 'Campaign duplicated successfully',
      })
    } catch (error: any) {
      console.error('Error duplicating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to duplicate campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}



