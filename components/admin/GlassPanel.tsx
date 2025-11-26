'use client'

import * as React from 'react'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card'
import { GeometricShape, GeometricOverlay } from '@/components/ui/geometric-shape'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends React.ComponentProps<'div'> {
  title?: string
  description?: string
  variant?: 'default' | 'gradient-border' | 'solid-border'
  blur?: 'sm' | 'md' | 'lg'
  geometricOverlay?: boolean
  footer?: React.ReactNode
  headerGradient?: boolean
}

export function GlassPanel({
  title,
  description,
  variant = 'gradient-border',
  blur = 'lg',
  geometricOverlay = false,
  footer,
  headerGradient = false,
  children,
  className,
  ...props
}: GlassPanelProps) {
  return (
    <GlassCard variant={variant} blur={blur} className={cn('relative overflow-hidden', className)} {...props}>
      {geometricOverlay && (
        <GeometricOverlay
          shapes={[
            { type: 'hexagon', size: 120, top: '10%', right: '5%', color: 'rgba(142, 36, 170, 0.05)' },
            { type: 'triangle', size: 100, bottom: '5%', left: '5%', color: 'rgba(255, 109, 0, 0.05)' },
          ]}
          className="absolute inset-0"
        />
      )}
      {(title || description) && (
        <GlassCardHeader gradient={headerGradient} className="relative z-10">
          {title && <GlassCardTitle>{title}</GlassCardTitle>}
          {description && <GlassCardDescription>{description}</GlassCardDescription>}
        </GlassCardHeader>
      )}
      <GlassCardContent className="relative z-10">
        {children}
      </GlassCardContent>
      {footer && (
        <GlassCardFooter className="relative z-10">
          {footer}
        </GlassCardFooter>
      )}
    </GlassCard>
  )
}



