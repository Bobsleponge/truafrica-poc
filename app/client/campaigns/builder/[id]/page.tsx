import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CampaignJourneyData, CampaignJourneyStepKey } from '@/types/campaign-journey'
import { createEmptyCampaignJourney, getStepKeyByIndex, getStepIndex } from '@/store/useCampaignBuilderStore'
import CampaignBuilderLayout from './components/CampaignBuilderLayout'

interface BuilderPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}

const normalizeMode = (mode?: string) => (mode === 'internal' ? 'internal' : 'client')

export default async function CampaignBuilderJourneyPage({ params, searchParams }: BuilderPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const requestedMode = normalizeMode(resolvedSearchParams.mode)

  if (resolvedParams.id === 'new') {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        client_id: user.id,
        name: 'Untitled Campaign',
        status: 'draft',
        wizard_data: createEmptyCampaignJourney(),
        wizard_step: getStepIndex('overview') + 1, // Convert to 1-based index for database
        campaign_mode: requestedMode === 'internal' ? 'internal_mode' : 'client_mode',
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to initialize campaign')
    }

    redirect(`/client/campaigns/builder/${data.id}?mode=${requestedMode}`)
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, wizard_data, wizard_step, campaign_mode, status, name')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const initialData = (data.wizard_data as CampaignJourneyData) || createEmptyCampaignJourney()
  const rawStep = data.wizard_step
  const stepFromLegacy =
    typeof rawStep === 'string'
      ? (rawStep as CampaignJourneyStepKey)
      : getStepKeyByIndex(Number(rawStep ?? 1) - 1)

  const resolvedMode =
    data.campaign_mode === 'internal_mode' ? 'internal' : requestedMode

  return (
    <CampaignBuilderLayout
      campaignId={data.id}
      initialData={initialData}
      initialStep={stepFromLegacy}
      mode={resolvedMode}
      campaignStatus={data.status}
      campaignName={data.name}
    />
  )
}

