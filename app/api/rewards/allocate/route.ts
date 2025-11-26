import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allocateReward, calculateRewardValue } from '@/lib/utils/rewards'
import type { RewardType } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contributorId, consensusScore, rewardType = 'airtime' } = body

    if (!contributorId || consensusScore === undefined) {
      return NextResponse.json(
        { error: 'Contributor ID and consensus score are required' },
        { status: 400 }
      )
    }

    // Verify user is a client owner, client user (Manager), team account, or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, sub_role')
      .eq('id', user.id)
      .single()

    const isClientOwner = userData?.role === 'client_owner'
    const isClientUserManager = userData?.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData?.role === 'team_account'
    const isAdmin = userData?.role === 'admin'

    // For now, allow any authenticated user (in production, restrict to admins/clients)
    // if (!isClientOwner && !isClientUserManager && !isTeamAccount && !isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Calculate and allocate reward
    const reward = allocateReward(contributorId, consensusScore, rewardType as RewardType)
    const rewardValue = calculateRewardValue(consensusScore)

    // Insert reward into database
    const { data: rewardData, error: insertError } = await supabase
      .from('rewards')
      .insert({
        contributor_id: contributorId,
        reward_type: reward.rewardType,
        value: rewardValue,
        status: reward.status,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to allocate reward' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reward: rewardData,
    })
  } catch (error: any) {
    console.error('Error allocating reward:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch rewards for a contributor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contributorId = searchParams.get('contributorId') || user.id

    // Verify user can access these rewards
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isClientOwner = userData?.role === 'client_owner'
    const isClientUser = userData?.role === 'client_user'
    const isTeamAccount = userData?.role === 'team_account'
    const isAdmin = userData?.role === 'admin'
    
    if (contributorId !== user.id && !isClientOwner && !isClientUser && !isTeamAccount && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rewards, error: fetchError } = await supabase
      .from('rewards')
      .select('*')
      .eq('contributor_id', contributorId)
      .order('awarded_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rewards: rewards || [],
    })
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

