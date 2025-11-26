'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeaderGradient, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRewardTypeDisplayName, formatRewardValue } from '@/lib/utils/rewards'
import { Award, Gift, Coins, Sparkles } from 'lucide-react'
import type { Reward } from '@/types/database'

interface RewardHistoryProps {
  rewards: Reward[]
}

export function RewardHistory({ rewards }: RewardHistoryProps) {
  const statusConfig: Record<string, { color: string; bg: string; glow: boolean; className: string }> = {
    pending: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      glow: false,
      className: 'status-pending'
    },
    awarded: {
      color: 'text-green-500',
      bg: 'bg-green-500/20 border-green-500/30',
      glow: true,
      className: 'status-correct'
    },
    redeemed: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/20 border-blue-500/30',
      glow: false,
      className: ''
    },
  }

  const totalRewards = rewards.reduce((sum, reward) => sum + Number(reward.value), 0)

  return (
    <Card className="floating" floating>
      <CardHeaderGradient>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Reward History
        </CardTitle>
        <CardDescription className="text-white/90">
          Total Rewards: <span className="font-bold text-white reward-success neon-glow-green">{totalRewards.toFixed(2)}</span> points
        </CardDescription>
      </CardHeaderGradient>
      <CardContent>
        {rewards.length === 0 ? (
          <motion.p 
            className="text-sm text-muted-foreground text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No rewards yet. Start answering questions to earn rewards!
          </motion.p>
        ) : (
          <div className="space-y-3">
            {rewards.slice(0, 5).map((reward, index) => {
              const config = statusConfig[reward.status] || statusConfig.pending
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`p-4 rounded-lg border ${config.bg} ${config.className} hover-lift cursor-pointer`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    boxShadow: config.glow ? '0 0 15px rgba(0, 230, 118, 0.3)' : undefined
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {reward.status === 'awarded' ? (
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Gift className="h-5 w-5 reward-success" />
                        </motion.div>
                      ) : reward.status === 'redeemed' ? (
                        <Coins className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Award className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{getRewardTypeDisplayName(reward.reward_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reward.awarded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold font-mono ${config.color} gradient-text`}>
                        {formatRewardValue(Number(reward.value), reward.reward_type)}
                      </p>
                      <Badge className={`${config.bg} ${config.color} border mt-1`}>
                        {reward.status}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {rewards.length > 5 && (
              <motion.p 
                className="text-xs text-muted-foreground text-center pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                +{rewards.length - 5} more rewards
              </motion.p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
