import { requirePlatformAdmin } from '@/lib/auth/rbac'
import CampaignDetail from '@/components/campaigns/CampaignDetail'

interface CampaignDetailPageProps {
  params: Promise<{ campaignId: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  await requirePlatformAdmin()
  const { campaignId } = await params
  
  return <CampaignDetail campaignId={campaignId} />
}



