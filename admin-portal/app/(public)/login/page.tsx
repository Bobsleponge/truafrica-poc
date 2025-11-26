import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/auth/rbac'
import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LoginPage() {
  // Redirect if already authenticated
  const admin = await getPlatformAdmin()
  if (admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm />
        <div className="text-center">
          <Link href="/login/quick-access">
            <Button variant="ghost" className="text-cyan-500 hover:text-cyan-400">
              Quick Access →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
