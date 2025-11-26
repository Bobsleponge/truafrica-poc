import { getPlatformAdmin } from '@/lib/auth/rbac'
import { User } from 'lucide-react'

export async function Navbar() {
  const admin = await getPlatformAdmin()

  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Admin Portal</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{admin?.email || 'Admin'}</span>
        </div>
      </div>
    </div>
  )
}



