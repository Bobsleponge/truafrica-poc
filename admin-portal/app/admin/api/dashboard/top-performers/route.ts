import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    // Top clients by campaign count
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('client_id, name')

    const clientCampaignCounts = new Map<string, { count: number; name: string }>()
    campaigns?.forEach((campaign) => {
      const existing = clientCampaignCounts.get(campaign.client_id) || { count: 0, name: campaign.name }
      existing.count++
      clientCampaignCounts.set(campaign.client_id, existing)
    })

    const topClients = Array.from(clientCampaignCounts.entries())
      .map(([clientId, data]) => ({ client_id: clientId, campaign_count: data.count }))
      .sort((a, b) => b.campaign_count - a.campaign_count)
      .slice(0, limit)

    // Get client details
    const clientIds = topClients.map((c) => c.client_id)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])

    const topClientsWithNames = topClients.map((tc) => {
      const client = clients?.find((c) => c.id === tc.client_id)
      return {
        ...tc,
        name: client?.name || 'Unknown',
      }
    })

    // Top contributors by answer count
    const { data: answers } = await supabase
      .from('answers')
      .select('contributor_id')

    const contributorAnswerCounts = new Map<string, number>()
    answers?.forEach((answer) => {
      contributorAnswerCounts.set(
        answer.contributor_id,
        (contributorAnswerCounts.get(answer.contributor_id) || 0) + 1
      )
    })

    const topContributors = Array.from(contributorAnswerCounts.entries())
      .map(([contributorId, count]) => ({ contributor_id: contributorId, answer_count: count }))
      .sort((a, b) => b.answer_count - a.answer_count)
      .slice(0, limit)

    // Get contributor details
    const contributorIds = topContributors.map((c) => c.contributor_id)
    const { data: contributors } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', contributorIds.length > 0 ? contributorIds : ['00000000-0000-0000-0000-000000000000'])

    const topContributorsWithNames = topContributors.map((tc) => {
      const contributor = contributors?.find((c) => c.id === tc.contributor_id)
      return {
        ...tc,
        name: contributor?.name || contributor?.email || 'Unknown',
        email: contributor?.email,
      }
    })

    return NextResponse.json({
      topClients: topClientsWithNames,
      topContributors: topContributorsWithNames,
    })
  } catch (error: any) {
    if (error.message === 'redirect') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



