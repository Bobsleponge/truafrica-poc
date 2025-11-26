import { requirePlatformAdmin } from '@/lib/auth/rbac'
import UserDetail from '@/components/users/UserDetail'

interface UserDetailPageProps {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requirePlatformAdmin()
  const { userId } = await params
  
  return <UserDetail userId={userId} />
}



