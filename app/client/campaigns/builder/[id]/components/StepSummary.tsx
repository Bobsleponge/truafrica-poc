'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { buildCampaignExportPayload } from '@/lib/campaign/exportService'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'

interface StepSummaryProps {
  summary?: string
  onSummaryChange?: (summary: string) => void
  onGenerateSummary?: () => Promise<void>
  generating?: boolean
}

export function StepSummary({ summary, onSummaryChange, onGenerateSummary, generating }: StepSummaryProps) {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const campaignId = useCampaignBuilderStore((state) => state.campaignId)
  const [localSummary, setLocalSummary] = useState(summary || '')
  const [internalGenerating, setInternalGenerating] = useState(false)

  useEffect(() => {
    setLocalSummary(summary || '')
  }, [summary])

  const handleGenerateSummary = async () => {
    if (onGenerateSummary) {
      await onGenerateSummary()
      return
    }
    setInternalGenerating(true)
    try {
      const response = await fetch('/api/campaigns/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign }),
      })
      const data = await response.json()
      if (data.summary) {
        setLocalSummary(data.summary)
        onSummaryChange?.(data.summary)
      }
    } finally {
      setInternalGenerating(false)
    }
  }

  const downloadFromAPI = async (format: string) => {
    if (!campaignId) return
    const response = await fetch(`/api/campaigns/${campaignId}/export?format=${format}`)
    if (format === 'shareable') {
      const data = await response.json()
      if (data.link) {
        window.open(data.link, '_blank')
      }
      return
    }
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json') && format !== 'json') {
      const data = await response.json()
      if (data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = data.filename || `campaign-${campaignId}.json`
        anchor.click()
        URL.revokeObjectURL(url)
      }
      return
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `campaign-${campaignId}.${format === 'markdown' ? 'md' : format}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadSnapshot = () => {
    const payload = buildCampaignExportPayload(campaign)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `campaign-${campaignId || 'draft'}-snapshot.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Executive summary</p>
            <p className="text-sm text-slate-300">
              AI-assisted summary to share with leadership.
            </p>
          </div>
          <Button onClick={handleGenerateSummary} disabled={generating ?? internalGenerating} className="bg-white/20 text-white">
            {generating ?? internalGenerating ? 'Generating...' : 'Refresh summary'}
          </Button>
        </div>
        <p className="mt-4 whitespace-pre-line text-lg text-white/90">
          {localSummary || 'Click "Refresh summary" to generate an executive-ready overview.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Campaign overview</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-200">
            <li>Company: {campaign.overview.companyName || 'N/A'}</li>
            <li>Industry: {campaign.overview.industry || 'N/A'}</li>
            <li>Primary goal: {campaign.goals.primaryGoal || 'N/A'}</li>
            <li>Respondents: {campaign.scale.respondents || 0}</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Targets</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-200">
            <li>Country: {campaign.audience.country || 'Multi-market'}</li>
            {campaign.audience.region && <li>Region: {campaign.audience.region}</li>}
            {campaign.audience.ageRange?.preset && (
              <li>
                Age: {
                  campaign.audience.ageRange.preset === 'all_adults' ? 'All adults' :
                  campaign.audience.ageRange.preset === 'custom' && (campaign.audience.ageRange.min || campaign.audience.ageRange.max)
                    ? `${campaign.audience.ageRange.min || 0}-${campaign.audience.ageRange.max || 100}`
                    : campaign.audience.ageRange.preset.replace('_', '-').replace('plus', '+')
                }
              </li>
            )}
            {campaign.audience.languages && campaign.audience.languages.length > 0 && (
              <li>Languages: {campaign.audience.languages.join(', ')}</li>
            )}
            {campaign.audience.localePreference && campaign.audience.localePreference !== 'none' && (
              <li>Locale: {campaign.audience.localePreference}</li>
            )}
            {campaign.audience.estimatedVolume && (
              <li>Volume: {campaign.audience.estimatedVolume}</li>
            )}
            <li>
              Reward budget: {campaign.rewards.computedTotalPoints?.toLocaleString() || '0'} points
              {campaign.rewards.computedTotalPoints && (
                <span className="text-slate-400">
                  {' '}(≈ ${((campaign.rewards.computedTotalPoints || 0) * 0.01).toFixed(2)} USD)
                </span>
              )}
            </li>
            <li>Pricing total: ${campaign.pricing.breakdown.total.toFixed(2)}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Exports</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Button className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white" onClick={() => downloadFromAPI('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" className="border-white/30 text-white" onClick={() => downloadFromAPI('json')}>
            Export JSON
          </Button>
          <Button variant="outline" className="border-white/30 text-white" onClick={() => downloadFromAPI('shareable')}>
            Proposal URL
          </Button>
          <Button variant="outline" className="border-white/30 text-white" onClick={downloadSnapshot}>
            Internal snapshot
          </Button>
        </div>
      </div>
    </div>
  )
}

