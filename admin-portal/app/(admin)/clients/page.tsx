import { requirePlatformAdmin } from '@/lib/auth/rbac'
import ClientsList from '@/components/clients/ClientsList'

export default async function ClientsPage() {
  await requirePlatformAdmin()
  
  return <ClientsList />
}



