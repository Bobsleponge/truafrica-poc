import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApprovalStatus } from '@/types/campaign-builder'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    // Get campaign to validate it's ready for approval
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_questions (question_id),
        campaign_pricing_snapshots (id)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Validate campaign is complete before approval
    if (status === 'approved' || status === 'client_review') {
      const questionCount = (campaign.campaign_questions as any[])?.length || 0
      const hasPricing = (campaign.campaign_pricing_snapshots as any[])?.length > 0

      if (questionCount === 0) {
        return NextResponse.json(
          { error: 'Cannot approve campaign without questions. Please finalize the campaign first.' },
          { status: 400 }
        )
      }

      if (!hasPricing) {
        return NextResponse.json(
          { error: 'Cannot approve campaign without pricing. Please finalize the campaign first.' },
          { status: 400 }
        )
      }

      // Check if campaign has been finalized (has questions linked)
      if (campaign.status === 'draft' && questionCount === 0) {
        return NextResponse.json(
          { error: 'Campaign must be finalized before approval. Please complete the wizard and finalize the campaign.' },
          { status: 400 }
        )
      }
    }

    // Update campaign approval status
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({
        approval_status: status as ApprovalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (campaignError) {
      throw campaignError
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('campaign_approvals')
      .insert({
        campaign_id: params.id,
        status: status as ApprovalStatus,
        reviewed_by: user.id,
        notes,
      })

    if (approvalError) {
      throw approvalError
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update approval status' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: approvals, error } = await supabase
      .from('campaign_approvals')
      .select('*')
      .eq('campaign_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      approvals: approvals || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get approval history' },
      { status: 500 }
    )
  }
}

