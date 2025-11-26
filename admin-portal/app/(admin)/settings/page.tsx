import { requirePlatformAdmin } from '@/lib/auth/rbac'
import SettingsContent from '@/components/settings/SettingsContent'

export default async function SettingsPage() {
  await requirePlatformAdmin()
  
  return <SettingsContent />
}



