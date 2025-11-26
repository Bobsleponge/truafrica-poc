'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RadialProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  glow?: boolean
  color?: 'primary' | 'success' | 'warning' | 'error'
}

const colorConfig = {
  primary: {
    stroke: '#8E24AA',
    glow: 'rgba(142, 36, 170, 0.4)',
  },
  success: {
    stroke: '#00E676',
    glow: 'rgba(0, 230, 118, 0.4)',
  },
  warning: {
    stroke: '#FFC107',
    glow: 'rgba(255, 193, 7, 0.4)',
  },
  error: {
    stroke: '#FF5252',
    glow: 'rgba(255, 82, 82, 0.4)',
  },
}

export function RadialProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  glow = false,
  color = 'primary',
}: RadialProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const config = colorConfig[color]

  return (
    <div className={cn('radial-progress relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: glow ? `drop-shadow(0 0 8px ${config.glow})` : 'none',
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-center"
          >
            <div
              className="text-lg sm:text-xl md:text-2xl font-bold font-mono"
              style={{ color: config.stroke }}
            >
              {value.toFixed(1)}
            </div>
            {max !== 100 && (
              <div className="text-xs text-muted-foreground">/ {max}</div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}


