'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import { cn } from '@/lib/utils'

const STRICTNESS_LEVELS: Array<{ key: 'low' | 'medium' | 'high'; description: string }> = [
  { key: 'low', description: 'Light validation, fastest throughput.' },
  { key: 'medium', description: 'Geo + duplicate checks.' },
  { key: 'high', description: 'Full validation stack with manual review.' },
]

export function StepScaleQuality() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)

  useEffect(() => {
    if (campaign.scale.validationStrictness === 'high') {
      if (!campaign.scale.autoGeoVerification) setField('scale', 'autoGeoVerification', true)
      if (!campaign.scale.autoDuplicateDetection) setField('scale', 'autoDuplicateDetection', true)
      if (!campaign.scale.aiQualityScoring) setField('scale', 'aiQualityScoring', true)
      if (!campaign.scale.autoDisqualification) setField('scale', 'autoDisqualification', true)
    }
  }, [
    campaign.scale.validationStrictness,
    campaign.scale.autoGeoVerification,
    campaign.scale.autoDuplicateDetection,
    campaign.scale.aiQualityScoring,
    campaign.scale.autoDisqualification,
    setField,
  ])

  const updateQuota = (value: string) => {
    const entries = value
      .split('\n')
      .map((line) => line.split(':'))
      .filter(([key, val]) => key && val)
    const quotas: Record<string, number> = {}
    entries.forEach(([key, val]) => {
      quotas[key.trim()] = Number(val.trim())
    })
    setField('scale', 'quotas', quotas)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Respondents</Label>
          <Input
            type="number"
            value={campaign.scale.respondents || ''}
            onChange={(event) => setField('scale', 'respondents', Number(event.target.value))}
            placeholder="e.g. 1500"
            className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Start date</Label>
          <Input
            type="date"
            value={campaign.scale.timeframe?.start || ''}
            onChange={(event) => setField('scale', 'timeframe', { ...campaign.scale.timeframe, start: event.target.value })}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">End date</Label>
          <Input
            type="date"
            value={campaign.scale.timeframe?.end || ''}
            onChange={(event) => setField('scale', 'timeframe', { ...campaign.scale.timeframe, end: event.target.value })}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Quotas</Label>
        <textarea
          rows={4}
          value={Object.entries(campaign.scale.quotas || {})
            .map(([key, val]) => `${key}:${val}`)
            .join('\n')}
          onChange={(event) => updateQuota(event.target.value)}
          placeholder="e.g. Nairobi:500"
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Validation strictness</Label>
        <div className="grid gap-4 md:grid-cols-3">
          {STRICTNESS_LEVELS.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => setField('scale', 'validationStrictness', level.key)}
              className={cn(
                'rounded-3xl border p-4 text-left transition-all duration-300',
                campaign.scale.validationStrictness === level.key
                  ? 'border-emerald-300/60 bg-emerald-400/10 text-white'
                  : 'border-white/10 text-slate-200'
              )}
            >
              <p className="text-lg font-semibold capitalize">{level.key}</p>
              <p className="text-sm text-slate-300">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          { key: 'autoGeoVerification', label: 'Geo verification' },
          { key: 'autoDuplicateDetection', label: 'Duplicate detection' },
          { key: 'aiQualityScoring', label: 'AI quality scoring' },
          { key: 'autoDisqualification', label: 'Auto disqualification' },
        ].map((toggle) => (
          <button
            key={toggle.key}
            type="button"
            onClick={() => setField('scale', toggle.key, !campaign.scale[toggle.key as keyof typeof campaign.scale])}
            className={cn(
              'rounded-3xl border px-4 py-3 text-left text-sm transition-all',
              campaign.scale[toggle.key as keyof typeof campaign.scale]
                ? 'border-cyan-300/50 bg-cyan-400/10 text-white'
                : 'border-white/10 text-slate-200'
            )}
          >
            {toggle.label}
          </button>
        ))}
      </div>
    </div>
  )
}

