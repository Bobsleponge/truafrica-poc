import { requirePlatformAdmin } from '@/lib/auth/rbac'
import CampaignsList from '@/components/campaigns/CampaignsList'

export default async function CampaignsPage() {
  await requirePlatformAdmin()
  
  return <CampaignsList />
}



