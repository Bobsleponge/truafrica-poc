'use client'

import { motion } from 'framer-motion'
import { RadialProgress } from '@/components/ui/radial-progress'
import { getTrustScoreTier } from '@/lib/utils/trustScore'
import { Shield } from 'lucide-react'

interface TrustScoreBadgeProps {
  trustScore: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TrustScoreBadge({ trustScore, showLabel = true, size = 'md' }: TrustScoreBadgeProps) {
  const tier = getTrustScoreTier(trustScore)
  
  const sizeConfig = {
    sm: { progress: 60, text: 'text-sm', icon: 'h-3 w-3' },
    md: { progress: 80, text: 'text-base', icon: 'h-4 w-4' },
    lg: { progress: 120, text: 'text-lg', icon: 'h-5 w-5' },
  }

  const colorMap = {
    green: 'success' as const,
    blue: 'primary' as const,
    yellow: 'warning' as const,
    gray: 'error' as const,
  }

  const config = sizeConfig[size]
  const color = colorMap[tier.color as keyof typeof colorMap] || 'primary'
  const glow = tier.color === 'green'

  return (
    <motion.div 
      className="flex items-center gap-4"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <RadialProgress
          value={trustScore}
          max={100}
          size={config.progress}
          strokeWidth={size === 'sm' ? 6 : size === 'md' ? 8 : 10}
          color={color}
          glow={glow}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className={`${config.icon} ${tier.color === 'green' ? 'text-[#00E676]' : tier.color === 'blue' ? 'text-[#5C6BC0]' : tier.color === 'yellow' ? 'text-[#FFC107]' : 'text-gray-500'}`} />
        </div>
      </div>
      {showLabel && (
        <div>
          <p className={`${config.text} font-bold gradient-text`}>{trustScore.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">{tier.label}</p>
          <p className="text-xs text-muted-foreground">Trust Score</p>
        </div>
      )}
    </motion.div>
  )
}

