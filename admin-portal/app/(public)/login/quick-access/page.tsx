'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowRight, LogIn } from 'lucide-react'

export default function QuickAccessPage() {
  const router = useRouter()

  const quickLogin = (email: string, password: string) => {
    // Auto-fill and submit login
    window.location.href = `/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&auto=true`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-cyan-500/20 shadow-lg shadow-cyan-500/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-cyan-500/10 rounded-full w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-cyan-500" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            TruAfrica Admin Portal
          </CardTitle>
          <CardDescription className="text-lg">Quick Access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={() => quickLogin('admin@example.com', 'dev123456')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6 text-lg shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40"
              size="lg"
            >
              <Shield className="h-5 w-5 mr-2" />
              Quick Login (Admin)
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Uses default admin credentials: admin@example.com
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full py-6 text-lg"
            size="lg"
          >
            Manual Login
          </Button>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Default Credentials:</p>
            <div className="space-y-1 text-xs font-mono">
              <p><span className="text-muted-foreground">Email:</span> admin@example.com</p>
              <p><span className="text-muted-foreground">Password:</span> dev123456</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

