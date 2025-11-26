'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PricingBreakdown } from '@/types/campaign-journey'

interface PricingCardProps {
  breakdown: PricingBreakdown
  loading?: boolean
}

const PRICING_KEYS: Array<{ key: keyof PricingBreakdown; label: string }> = [
  { key: 'setupFee', label: 'Setup fee' },
  { key: 'perResponseFee', label: 'Per-response fee' },
  { key: 'rewardBudget', label: 'Reward budget' },
  { key: 'validationFee', label: 'Validation fee' },
  { key: 'analyticsFee', label: 'Analytics' },
  { key: 'fineTuningFee', label: 'Fine-tuning' },
  { key: 'internalMargin', label: 'Internal margin (%)' },
  { key: 'recommendedDiscount', label: 'Recommended discount (%)' },
]

export function PricingCard({ breakdown, loading }: PricingCardProps) {
  return (
    <Card className="border border-white/10 bg-white/5 text-white shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-white">Pricing & Commercials</CardTitle>
            <CardDescription className="text-slate-300">Live estimate powered by TruAfrica pricing engine.</CardDescription>
          </div>
          <Badge variant="outline" className="border-fuchsia-400/50 text-fuchsia-200">
            {loading ? 'Updating' : 'Realtime'}
          </Badge>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/80">Total estimated cost</p>
          <p className="text-4xl font-semibold">
            ${breakdown.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {PRICING_KEYS.map(({ key, label }) => (
          <div key={key} className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {['internalMargin', 'recommendedDiscount'].includes(key)
                ? `${breakdown[key].toFixed(1)}%`
                : `$${breakdown[key].toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

