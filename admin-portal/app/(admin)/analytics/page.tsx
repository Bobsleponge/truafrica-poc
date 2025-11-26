import { requirePlatformAdmin } from '@/lib/auth/rbac'
import AnalyticsContent from '@/components/analytics/AnalyticsContent'

export default async function AnalyticsPage() {
  await requirePlatformAdmin()
  
  return <AnalyticsContent />
}



