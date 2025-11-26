import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          users!campaigns_client_id_fkey (
            id,
            name,
            email
          ),
          campaign_questions (
            *,
            questions (*)
          ),
          reward_configurations (*),
          campaign_quality_rules (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        campaign,
      })
    } catch (error: any) {
      console.error('Error fetching campaign:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const body = await request.json()
      const supabase = await createClient()

      // Update campaign fields
      const updateData: any = {}
      const allowedFields = [
        'name', 'description', 'status', 'approval_status', 'objective',
        'total_budget', 'reward_budget', 'setup_fee', 'per_response_fee',
        'validation_fee', 'analytics_fee', 'fine_tuning_fee',
        'target_countries', 'target_provinces', 'age_bracket', 'occupation',
        'languages', 'dialects', 'start_date', 'end_date', 'estimated_duration',
        'needs_question_design', 'needs_review', 'is_locked'
      ]

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      updateData.updated_at = new Date().toISOString()

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        campaign,
      })
    } catch (error: any) {
      console.error('Error updating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign', details: error.message },
        { status: 500 }
      )
    }
  })
}



