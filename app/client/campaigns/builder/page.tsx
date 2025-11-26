import { redirect } from 'next/navigation'

interface LegacyBuilderRedirectProps {
  searchParams: Promise<{
    id?: string
    inHouse?: string
    mode?: string
  }>
}

export default async function CampaignBuilderPage({ searchParams }: LegacyBuilderRedirectProps) {
  const resolved = await searchParams
  const mode = resolved.mode || (resolved.inHouse === 'true' ? 'internal' : 'client')
  const targetId = resolved.id || 'new'

  redirect(`/client/campaigns/builder/${targetId}?mode=${mode}`)
}

