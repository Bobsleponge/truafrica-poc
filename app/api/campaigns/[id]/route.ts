import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/campaigns/[id]
 * Get a single campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.role === 'admin'
    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'

    if (!isAdmin && !isClientOwner && !isClientUserManager && !isTeamAccount) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, or team account access required' },
        { status: 403 }
      )
    }

    // Get campaign with relations
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_briefs (*),
        campaign_questions (
          id,
          question_id,
          question_type,
          required_responses,
          complexity_level,
          questions:question_id (
            id,
            content,
            difficulty_level,
            status
          )
        )
      `)
      .eq('id', id)
      .single()

    // Filter by client_id if not admin or team account
    if (!isAdmin && !isTeamAccount) {
      // For client users, need to check their client_id
      if (isClientUser) {
        const { data: clientUserData } = await supabase
          .from('users')
          .select('client_id')
          .eq('id', user.id)
          .single()
        
        if (clientUserData?.client_id) {
          // Get all users with the same client_id
          const { data: clientUsers } = await supabase
            .from('users')
            .select('id')
            .eq('client_id', clientUserData.client_id)
            .in('role', ['client_owner', 'client_user'])
          
          const clientUserIds = clientUsers?.map(u => u.id) || []
          query = query.in('client_id', clientUserIds)
        }
      } else {
        // For client owners, filter by their own id
        query = query.eq('client_id', user.id)
      }
    }

    const { data: campaign, error } = await query

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error: any) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Update campaign fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.role === 'admin'
    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'

    if (!isAdmin && !isClientOwner && !isClientUserManager && !isTeamAccount) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, or team account access required' },
        { status: 403 }
      )
    }

    // Get campaign to verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('client_id, internal_owner_id, status')
      .eq('id', id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify ownership
    const isOwner = campaign.client_id === user.id || campaign.internal_owner_id === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this campaign' },
        { status: 403 }
      )
    }

    // Define allowed fields for update
    const allowedFields = [
      'name',
      'description',
      'objective',
      'target_countries',
      'target_demo',
    ]

    // Build update object
    const updateData: any = {}
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

    // Update campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update campaign', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = userData.role === 'admin'
    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'

    if (!isAdmin && !isClientOwner && !isClientUserManager && !isTeamAccount) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, or team account access required' },
        { status: 403 }
      )
    }

    // Get campaign to verify ownership and status
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('client_id, internal_owner_id, status')
      .eq('id', id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify ownership
    const isOwner = campaign.client_id === user.id || campaign.internal_owner_id === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this campaign' },
        { status: 403 }
      )
    }

    // Prevent deletion of running campaigns (unless admin)
    if (campaign.status === 'running' && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete a running campaign. Please stop it first.' },
        { status: 400 }
      )
    }

    // Delete campaign (cascade deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete campaign', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

