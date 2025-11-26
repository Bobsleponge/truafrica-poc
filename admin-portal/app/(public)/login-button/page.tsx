'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield, LogIn } from 'lucide-react'

export default function LoginButtonPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <div className="mx-auto p-4 bg-cyan-500/10 rounded-full w-20 h-20 flex items-center justify-center">
            <Shield className="h-10 w-10 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            TruAfrica Admin Portal
          </h1>
          <p className="text-muted-foreground">Click the button below to login</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-6 text-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40"
            size="lg"
          >
            <LogIn className="h-6 w-6 mr-3" />
            Login to Admin Portal
          </Button>

          <div className="pt-4">
            <Button
              onClick={() => router.push('/login/quick-access')}
              variant="outline"
              className="text-cyan-500 border-cyan-500/50 hover:bg-cyan-500/10"
            >
              Quick Access (Auto-fill credentials)
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
          <p className="text-sm font-medium mb-2">Default Admin Credentials:</p>
          <div className="space-y-1 text-xs font-mono text-left">
            <p><span className="text-muted-foreground">Email:</span> admin@example.com</p>
            <p><span className="text-muted-foreground">Password:</span> dev123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}



