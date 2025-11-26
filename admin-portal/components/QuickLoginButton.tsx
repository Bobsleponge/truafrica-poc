'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function QuickLoginButton() {
  const router = useRouter()

  return (
    <Button
      onClick={() => router.push('/login')}
      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40"
      size="lg"
    >
      <Shield className="h-5 w-5 mr-2" />
      Admin Portal Login
    </Button>
  )
}



