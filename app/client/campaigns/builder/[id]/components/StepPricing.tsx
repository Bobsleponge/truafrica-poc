'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import { PricingCard } from './PricingCard'
import type { PricingBreakdown } from '@/types/campaign-journey'

export function StepPricing() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/campaigns/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate pricing')
        }

        const data = await response.json()
        const breakdown = data.breakdown as PricingBreakdown

        if (!active) return

        const existing = campaign.pricing.breakdown || {}
        const changed = JSON.stringify(existing) !== JSON.stringify(breakdown)
        if (changed) {
          setField('pricing', 'breakdown', breakdown)
        }
      } catch (error) {
        console.error('Error calculating pricing:', error)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [
    campaign,
    campaign.questions,
    campaign.rewards.computedTotalBudget,
    campaign.rewards.currency,
    campaign.scale.respondents,
    setField,
  ])

  if (campaign.pricing.hidePricing) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-indigo-400/40 bg-indigo-500/10 p-6 text-indigo-100">
        <AlertTriangle className="h-5 w-5" />
        Internal campaign mode detected — pricing hidden from this journey.
      </div>
    )
  }

  return <PricingCard breakdown={campaign.pricing.breakdown} loading={loading} />
}

