'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from './glass-card'
import { GeometricOverlay } from './geometric-shape'
import { cn } from '@/lib/utils'

interface DataVisualizationCardProps extends React.ComponentProps<'div'> {
  title: string
  description?: string
  children: React.ReactNode
  interactive?: boolean
  gradient?: boolean
  geometricOverlay?: boolean
  className?: string
}

export function DataVisualizationCard({
  title,
  description,
  children,
  interactive = true,
  gradient = false,
  geometricOverlay = true,
  className,
  ...props
}: DataVisualizationCardProps) {
  return (
    <GlassCard
      variant={gradient ? 'gradient-border' : 'default'}
      blur="lg"
      hover={interactive}
      floating={interactive}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {geometricOverlay && (
        <GeometricOverlay
          shapes={[
            { type: 'circle', size: 200, top: '-100px', right: '-100px', color: 'rgba(142, 36, 170, 0.05)' },
            { type: 'triangle', size: 120, bottom: '-60px', left: '-60px', color: 'rgba(255, 109, 0, 0.05)' },
          ]}
          className="absolute inset-0"
        />
      )}
      
      <GlassCardHeader gradient={gradient}>
        <GlassCardTitle className={cn(
          gradient ? 'text-white' : '',
          'text-base sm:text-lg md:text-xl'
        )}>
          {title}
        </GlassCardTitle>
        {description && (
          <GlassCardDescription className={cn(
            gradient ? 'text-white/90' : '',
            'text-xs sm:text-sm'
          )}>
            {description}
          </GlassCardDescription>
        )}
      </GlassCardHeader>
      
      <GlassCardContent className="relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </GlassCardContent>
    </GlassCard>
  )
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  height?: number
  interactive?: boolean
}

export function ChartContainer({
  children,
  height = 300,
  interactive = true,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg bg-white/5 dark:bg-black/10 p-2 sm:p-3 md:p-4 w-full',
        interactive && 'hover:bg-white/10 dark:hover:bg-black/20 transition-colors',
        className
      )}
      style={{ minHeight: height, maxHeight: '100%' }}
      {...props}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  )
}

