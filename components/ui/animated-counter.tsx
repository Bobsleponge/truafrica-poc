'use client'

import * as React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  formatValue?: (value: number) => string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  formatValue,
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
  })

  const display = useTransform(spring, (current) => {
    if (formatValue) {
      return formatValue(current)
    }
    return `${prefix}${current.toFixed(decimals)}${suffix}`
  })

  React.useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <motion.span className={cn('inline-block tabular-nums', className)}>
      {display}
    </motion.span>
  )
}

interface AnimatedStatCardProps {
  label: string
  value: number
  icon?: React.ReactNode
  formatValue?: (value: number) => string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function AnimatedStatCard({
  label,
  value,
  icon,
  formatValue,
  trend,
  className,
}: AnimatedStatCardProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-3xl font-bold">
        <AnimatedCounter
          value={value}
          formatValue={formatValue}
          duration={1.5}
        />
      </div>
      {trend && (
        <div className={cn(
          'text-xs mt-1',
          trend.isPositive ? 'text-green-500' : 'text-red-500'
        )}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
    </div>
  )
}



