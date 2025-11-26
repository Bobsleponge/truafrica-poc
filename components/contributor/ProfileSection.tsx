'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadialProgress } from '@/components/ui/radial-progress'
import { Button } from '@/components/ui/button'
import { User, Globe, Languages, Award, CheckCircle2, AlertCircle } from 'lucide-react'
import { getTrustScoreTier } from '@/lib/utils/trustScore'
import type { User as UserType } from '@/types/database'

interface ProfileSectionProps {
  profile: UserType
  onOnboardingClick?: () => void
}

export function ProfileSection({ profile, onOnboardingClick }: ProfileSectionProps) {
  const tier = getTrustScoreTier(Number(profile.trust_score))
  
  const tierColors = {
    green: { stroke: '#00E676', glow: true },
    blue: { stroke: '#5C6BC0', glow: false },
    yellow: { stroke: '#FFC107', glow: false },
    gray: { stroke: '#6B7280', glow: false },
  }

  const config = tierColors[tier.color as keyof typeof tierColors] || tierColors.gray

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar with gradient border */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8E24AA] to-[#FF6D00] p-1" style={{ animation: 'gradient-border 3s ease-in-out infinite' }}>
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              {profile.onboarding_completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 bg-[#00E676] rounded-full p-1.5 shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  {profile.name || 'Contributor'}
                </h2>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  {profile.country && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{profile.country}</span>
                    </div>
                  )}
                  {profile.languages && profile.languages.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Languages className="h-4 w-4" />
                      <span>{profile.languages.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Score Radial Progress */}
              <div className="flex items-center gap-6">
                <RadialProgress
                  value={Number(profile.trust_score)}
                  max={100}
                  size={100}
                  strokeWidth={8}
                  color={tier.color === 'green' ? 'success' : tier.color === 'blue' ? 'primary' : tier.color === 'yellow' ? 'warning' : 'error'}
                  glow={config.glow}
                />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trust Score</p>
                  <p className="text-lg font-bold" style={{ color: config.stroke }}>
                    {profile.trust_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">{tier.label}</p>
                </div>
              </div>

              {/* Expertise Fields */}
              {profile.expertise_fields && profile.expertise_fields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Expertise Fields</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise_fields.map((field, index) => (
                      <motion.div
                        key={field}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Badge className="gradient-primary text-white border-0 hover-lift">
                          {field}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Onboarding Status */}
              {!profile.onboarding_completed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                >
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-500">Onboarding Incomplete</p>
                    <p className="text-xs text-muted-foreground">Complete onboarding to start earning rewards</p>
                  </div>
                  {onOnboardingClick && (
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={onOnboardingClick}
                    >
                      Complete
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

