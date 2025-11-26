'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from '@/components/ui/glass-card'
import { GeometricShape } from '@/components/ui/geometric-shape'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden flex items-center justify-center p-6">
      {/* Geometric Background Decorations */}
      <GeometricShape
        type="hexagon"
        size={300}
        top="-150px"
        right="-150px"
        color="rgba(255, 82, 82, 0.05)"
        animated
      />
      <GeometricShape
        type="diamond"
        size={250}
        bottom="-125px"
        left="-125px"
        color="rgba(142, 36, 170, 0.05)"
        animated
      />

      <GlassCard variant="gradient-border" blur="lg" className="max-w-md w-full relative overflow-hidden">
        <GeometricShape
          type="circle"
          size={120}
          top="-60px"
          right="-60px"
          color="rgba(255, 82, 82, 0.1)"
          position="absolute"
          zIndex={0}
        />
        <GlassCardHeader gradient className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/20 border border-destructive/30">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <GlassCardTitle className="text-center text-2xl">Access Forbidden</GlassCardTitle>
          <GlassCardDescription className="text-center text-white/90">
            You don't have permission to access this resource
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="relative z-10 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This page requires administrator privileges. If you believe this is an error, please contact your system administrator.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full hover-3d"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}



