import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CampaignStatus } from '@/types/database'

/**
 * PATCH /api/campaigns/[id]/status
 * Update campaign status with validation
 */
export async function PATCH(
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
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses: CampaignStatus[] = ['draft', 'running', 'completed', 'archived']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const campaignId = params.id

    // Get current campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_questions (question_id)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin'
    const isTeamAccount = userData?.role === 'team_account'
    const isClientOwner = userData?.role === 'client_owner'
    const isClientUserManager = userData?.role === 'client_user' && userData.sub_role === 'Manager'
    
    // Check ownership - for client users, check if they share the same client_id
    let isOwner = campaign.client_id === user.id || campaign.internal_owner_id === user.id
    if (!isOwner && isClientUserManager && userData.client_id) {
      // Get the client owner's user id
      const { data: clientOwner } = await supabase
        .from('users')
        .select('id')
        .eq('client_id', userData.client_id)
        .eq('role', 'client_owner')
        .single()
      
      if (clientOwner) {
        isOwner = campaign.client_id === clientOwner.id
      }
    }

    if (!isAdmin && !isTeamAccount && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this campaign' },
        { status: 403 }
      )
    }

    const currentStatus = campaign.status as CampaignStatus

    // Validate status transitions
    const validationError = validateStatusTransition(currentStatus, status, campaign)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Perform status update
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: status as CampaignStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update campaign status' },
        { status: 500 }
      )
    }

    // Handle status-specific actions
    if (status === 'running') {
      // Activate all questions for this campaign
      const questionIds = (campaign.campaign_questions || []).map((cq: any) => cq.question_id)
      if (questionIds.length > 0) {
        await supabase
          .from('questions')
          .update({ status: 'active' })
          .in('id', questionIds)
      }
    } else if (status === 'completed' || status === 'archived') {
      // Deactivate questions when campaign ends
      const questionIds = (campaign.campaign_questions || []).map((cq: any) => cq.question_id)
      if (questionIds.length > 0) {
        await supabase
          .from('questions')
          .update({ status: 'inactive' })
          .in('id', questionIds)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Campaign status updated to ${status}`,
      status,
    })
  } catch (error: any) {
    console.error('Error updating campaign status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update campaign status' },
      { status: 500 }
    )
  }
}

/**
 * Validate status transition
 */
function validateStatusTransition(
  currentStatus: CampaignStatus,
  newStatus: CampaignStatus,
  campaign: any
): string | null {
  // No change
  if (currentStatus === newStatus) {
    return null
  }

  // No backward transitions (except completed -> archived)
  if (currentStatus === 'running' && newStatus === 'draft') {
    return 'Cannot revert running campaign to draft'
  }
  if (currentStatus === 'completed' && newStatus === 'draft') {
    return 'Cannot revert completed campaign to draft'
  }
  if (currentStatus === 'completed' && newStatus === 'running') {
    return 'Cannot restart completed campaign'
  }
  if (currentStatus === 'archived' && newStatus !== 'archived') {
    return 'Cannot change status of archived campaign'
  }

  // Validate draft -> running transition
  if (currentStatus === 'draft' && newStatus === 'running') {
    // Must have questions
    const questionCount = (campaign.campaign_questions || []).length
    if (questionCount === 0) {
      return 'Cannot start campaign without questions. Please finalize the campaign first.'
    }

    // Must be approved
    if (campaign.approval_status !== 'approved') {
      return 'Campaign must be approved before it can be started. Current approval status: ' + (campaign.approval_status || 'draft')
    }

    // Should have pricing
    if (!campaign.total_budget && !campaign.wizard_data?.pricing) {
      return 'Campaign must have pricing before it can be started. Please finalize the campaign first.'
    }
  }

  // All other transitions are valid
  return null
}

/**
 * GET /api/campaigns/[id]/status
 * Get current campaign status and available transitions
 */
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

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        status,
        approval_status,
        campaign_questions (question_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const currentStatus = campaign.status as CampaignStatus
    const availableTransitions: CampaignStatus[] = []

    // Determine available transitions
    switch (currentStatus) {
      case 'draft':
        // Can go to running (if validated) or archived
        if (validateStatusTransition(currentStatus, 'running', campaign) === null) {
          availableTransitions.push('running')
        }
        availableTransitions.push('archived')
        break
      case 'running':
        availableTransitions.push('completed', 'archived')
        break
      case 'completed':
        availableTransitions.push('archived')
        break
      case 'archived':
        // No transitions from archived
        break
    }

    return NextResponse.json({
      success: true,
      currentStatus,
      availableTransitions,
      canStart: validateStatusTransition(currentStatus, 'running', campaign) === null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get campaign status' },
      { status: 500 }
    )
  }
}
