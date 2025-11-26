'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import AdminNav from '@/components/admin/AdminNav'
import { AdminNavbar } from '@/components/admin/AdminNavbar'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [checkingRole, setCheckingRole] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      setCheckingRole(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || data?.role !== 'admin') {
          router.push('/403')
          return
        }

        setIsAuthorized(true)
      } catch (err) {
        console.error('Error checking admin access:', err)
        router.push('/403')
      } finally {
        setCheckingRole(false)
      }
    }

    checkAdminAccess()
  }, [user, authLoading, router, supabase])

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <GlassCard variant="solid-border" blur="md" className="p-8">
          <GlassCardContent className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying access...</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect to /403
  }

  return (
    <div className="flex h-screen bg-[#121212]">
      <AdminNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}


