import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/auth/rbac'

interface AdminRouteProps {
  children: React.ReactNode
}

/**
 * Server component wrapper that enforces platform_admin access
 * Redirects to /login if not authenticated or not platform_admin
 */
export default async function AdminRoute({ children }: AdminRouteProps) {
  await requirePlatformAdmin()
  return <>{children}</>
}



