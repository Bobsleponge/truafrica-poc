import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/campaigns/share/[token]
 * Get campaign by share token (public endpoint, no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const token = params.token

    // Try to decode token to get campaign ID
    let campaignId: string | null = null
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [id] = decoded.split(':')
      if (id && id.length === 36) { // UUID length check
        campaignId = id
      }
    } catch {
      // Token might not be base64, continue with search
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Invalid share token format' },
        { status: 400 }
      )
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, wizard_data, created_at')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if share token is valid (check expiration from wizard_data)
    const wizardData = campaign.wizard_data as any
    if (wizardData?.shareExpiresAt) {
      const expiresAt = new Date(wizardData.shareExpiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'This share link has expired' },
          { status: 410 }
        )
      }
    }

    // Verify share token matches
    if (wizardData?.shareToken !== token) {
      return NextResponse.json(
        { error: 'Invalid share token' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        wizard_data: campaign.wizard_data,
        created_at: campaign.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error loading shareable campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load campaign' },
      { status: 500 }
    )
  }
}



