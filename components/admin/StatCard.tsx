'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { GeometricShape } from '@/components/ui/geometric-shape'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  formatValue?: (value: number) => string
  className?: string
  variant?: 'default' | 'gradient-border' | 'solid-border'
  geometricType?: 'circle' | 'hexagon' | 'triangle' | 'diamond'
  geometricColor?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  formatValue,
  className,
  variant = 'gradient-border',
  geometricType = 'circle',
  geometricColor = 'rgba(142, 36, 170, 0.1)',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('relative', className)}
    >
      <GlassCard variant={variant} blur="md" floating hover className="hover-3d relative overflow-hidden">
        <GeometricShape
          type={geometricType}
          size={60}
          top="-20px"
          right="-20px"
          color={geometricColor}
          position="absolute"
          zIndex={0}
        />
        <GlassCardHeader className="relative z-10">
          <GlassCardTitle className="text-sm flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <span>{label}</span>
          </GlassCardTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </GlassCardHeader>
        <GlassCardContent className="relative z-10">
          <div className="flex items-baseline justify-between">
            <AnimatedCounter
              value={value}
              formatValue={formatValue}
              className="text-2xl font-bold"
            />
            {trend && (
              <div className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                {trend.label && ` ${trend.label}`}
              </div>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  )
}



