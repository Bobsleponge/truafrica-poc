import { redirect } from 'next/navigation'

export default function NewInHouseCampaignPage() {
  redirect('/client/campaigns/builder/new?mode=internal')
}

