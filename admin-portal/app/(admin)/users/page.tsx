import { requirePlatformAdmin } from '@/lib/auth/rbac'
import UsersList from '@/components/users/UsersList'

export default async function UsersPage() {
  await requirePlatformAdmin()
  
  return <UsersList />
}



