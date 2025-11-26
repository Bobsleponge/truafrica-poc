'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CampaignJourneyStepKey } from '@/types/campaign-journey'

interface AIHelperSidebarProps {
  currentStep: CampaignJourneyStepKey
  autoSaveStatus: string
  campaignName?: string
  summary?: string
  summaryLoading?: boolean
  onGenerateSummary?: () => Promise<void>
  insights?: string[]
}

const STEP_HINTS: Record<CampaignJourneyStepKey, string[]> = {
  overview: [
    'Keep the one-line objective action-oriented.',
    'Internal owners unlock faster approvals.',
  ],
  goals: [
    'Choose a single dominant modality.',
    'Branch only when value > effort.',
  ],
  audience: [
    'Select languages when targeting audio or reasoning goals.',
    'Urban/rural preference helps target the right demographics.',
  ],
  questions: [
    'Use AI templates to avoid bias.',
    'Link rewards to complexity per question.',
  ],
  rewards: [
    'Fairness sliders impact drop-off rates.',
    'Match reward type to local payment rails.',
  ],
  scale: [
    'Strict validation ups cost but cuts fraud.',
    'Timeframes auto-balance collection speed.',
  ],
  pricing: [
    'Discounts unlock on 1k+ respondents.',
    'Fine-tuning fees trigger only when needed.',
  ],
  summary: [
    'Export executive-ready PDFs instantly.',
    'AI summary updates with every change.',
  ],
}

export function AIHelperSidebar({
  currentStep,
  autoSaveStatus,
  campaignName,
  summary,
  summaryLoading,
  onGenerateSummary,
  insights = [],
}: AIHelperSidebarProps) {
  const hints = useMemo(
    () => [...(STEP_HINTS[currentStep] || []), ...insights],
    [currentStep, insights]
  )

  return (
    <aside className="sticky top-6 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_35px_120px_rgba(59,130,246,0.35)] backdrop-blur-2xl motion-safe:animate-pulse">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200/70">AI Navigator</p>
        <h3 className="text-2xl font-semibold">{campaignName || 'TruAfrica Campaign'}</h3>
        <Badge
          variant="outline"
          className="border-lime-300/40 bg-lime-300/10 text-lime-100"
        >
          {autoSaveStatus === 'saving' && 'Saving...'}
          {autoSaveStatus === 'success' && 'Autosaved'}
          {autoSaveStatus === 'error' && 'Save issue'}
          {autoSaveStatus === 'idle' && 'Draft mode'}
        </Badge>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white/80">Step intelligence</p>
        <ul className="space-y-2 text-sm text-slate-200/90">
          {hints.map((hint) => (
            <li key={hint} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 p-4">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">Executive summary</p>
        <p className="text-sm text-white/90">{summary || 'Generate an AI-written summary once you are ready.'}</p>
        {onGenerateSummary && (
          <Button
            onClick={onGenerateSummary}
            disabled={summaryLoading}
            className="w-full bg-white/20 text-white hover:bg-white/30"
          >
            {summaryLoading ? 'Generating...' : 'Generate summary'}
          </Button>
        )}
      </div>
    </aside>
  )
}

