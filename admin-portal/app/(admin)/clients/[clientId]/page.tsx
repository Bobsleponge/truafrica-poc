import { requirePlatformAdmin } from '@/lib/auth/rbac'
import ClientDetail from '@/components/clients/ClientDetail'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  await requirePlatformAdmin()
  const { clientId } = await params
  
  return <ClientDetail clientId={clientId} />
}



