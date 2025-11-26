import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  await requirePlatformAdmin()
  
  return <DashboardContent />
}



