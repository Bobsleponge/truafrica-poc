import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/middleware/apiAuth'

/**
 * POST /api/auth/api-key
 * Generate a new API key for the authenticated client
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user (Manager), team account, or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, sub_role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'
    const isAdmin = userData.role === 'admin'

    if (!isClientOwner && !isClientUserManager && !isTeamAccount && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, team account, or admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    // Generate API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)

    // Store hashed key
    const { data: storedKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        client_id: user.id,
        key_hash: keyHash,
        name: name.trim(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      )
    }

    // Return the plaintext key (only shown once)
    return NextResponse.json({
      success: true,
      apiKey,
      apiKeyId: storedKey.id,
      name: storedKey.name,
      warning: 'Store this API key securely. It will not be shown again.',
    })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/api-key
 * List all API keys for the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user (Manager), team account, or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, sub_role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'
    const isAdmin = userData.role === 'admin'

    if (!isClientOwner && !isClientUserManager && !isTeamAccount && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, team account, or admin access required' },
        { status: 403 }
      )
    }

    // Get API keys (without the actual key, only metadata)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, last_used_at, created_at, revoked_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || [],
    })
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/api-key
 * Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is client owner, client user (Manager), team account, or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, sub_role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isClientOwner = userData.role === 'client_owner'
    const isClientUserManager = userData.role === 'client_user' && userData.sub_role === 'Manager'
    const isTeamAccount = userData.role === 'team_account'
    const isAdmin = userData.role === 'admin'

    if (!isClientOwner && !isClientUserManager && !isTeamAccount && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Client owner, Manager, team account, or admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get('id')

    if (!apiKeyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    // Verify the API key belongs to the user
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('client_id')
      .eq('id', apiKeyId)
      .single()

    if (fetchError || !apiKey || apiKey.client_id !== user.id) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Revoke the key
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', apiKeyId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error: any) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


