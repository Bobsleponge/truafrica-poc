'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import type { CampaignJourneyData, CampaignJourneyMode, CampaignJourneyStepKey } from '@/types/campaign-journey'
import { useCampaignBuilderStore, getStepIndex } from '@/store/useCampaignBuilderStore'
import { StepContainer } from './StepContainer'
import { StepOverview } from './StepOverview'
import { StepGoals } from './StepGoals'
import { StepAudience } from './StepAudience'
import { StepQuestions } from './StepQuestions'
import { StepRewards } from './StepRewards'
import { StepScaleQuality } from './StepScaleQuality'
import { StepPricing } from './StepPricing'
import { StepSummary } from './StepSummary'
import { AIHelperSidebar } from './AIHelperSidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CampaignBuilderLayoutProps {
  campaignId: string
  initialData: CampaignJourneyData
  initialStep: CampaignJourneyStepKey
  mode: CampaignJourneyMode
  campaignStatus?: string
  campaignName?: string
}

interface StepMeta {
  key: CampaignJourneyStepKey
  title: string
  subtitle: string
  component: ComponentType<any>
}

const STEP_META: StepMeta[] = [
  { key: 'overview', title: 'Overview', subtitle: 'Set the strategic context.', component: StepOverview },
  { key: 'goals', title: 'Goals & use case', subtitle: 'Choose modalities with smart branching.', component: StepGoals },
  { key: 'audience', title: 'Target audience', subtitle: 'Target markets, languages, and scale.', component: StepAudience },
  { key: 'questions', title: 'AI question builder', subtitle: 'Design adaptive questions with AI.', component: StepQuestions },
  { key: 'rewards', title: 'Rewards & incentives', subtitle: 'Align payouts with fairness and modality.', component: StepRewards },
  { key: 'scale', title: 'Scale & quality', subtitle: 'Respondent counts, quotas, and QA layers.', component: StepScaleQuality },
  { key: 'pricing', title: 'Pricing & commercials', subtitle: 'Realtime cost intelligence.', component: StepPricing },
  { key: 'summary', title: 'Summary & export', subtitle: 'Executive wrap-up and exports.', component: StepSummary },
]

export default function CampaignBuilderLayout({
  campaignId,
  initialData,
  initialStep,
  mode,
  campaignStatus,
  campaignName,
}: CampaignBuilderLayoutProps) {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const hydrate = useCampaignBuilderStore((state) => state.hydrate)
  const currentStep = useCampaignBuilderStore((state) => state.currentStep)
  const setCurrentStep = useCampaignBuilderStore((state) => state.setCurrentStep)
  const autoSaveStatus = useCampaignBuilderStore((state) => state.autoSaveStatus)
  const branching = useCampaignBuilderStore((state) => state.branching)
  const initialized = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [aiSummary, setAISummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [finalMessage, setFinalMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized.current) {
      hydrate({ campaignId, data: initialData, mode })
      setCurrentStep(initialStep)
      initialized.current = true
      setMounted(true)
    }
  }, [campaignId, hydrate, initialData, initialStep, mode, setCurrentStep])

  const visibleSteps = useMemo(() => {
    return STEP_META.filter((step) => {
      if (step.key === 'questions') return branching.shouldShowQuestionBuilder
      if (step.key === 'pricing') return branching.shouldShowPricing
      return true
    })
  }, [branching.shouldShowQuestionBuilder, branching.shouldShowPricing])

  useEffect(() => {
    if (!visibleSteps.some((step) => step.key === currentStep)) {
      setCurrentStep(visibleSteps[0]?.key || 'overview')
    }
  }, [visibleSteps, currentStep, setCurrentStep])

  const activeIndex = visibleSteps.findIndex((step) => step.key === currentStep)
  const activeStep = visibleSteps[activeIndex] || visibleSteps[0]
  const StepComponent = activeStep.component

  const goToStep = (index: number) => {
    if (index >= 0 && index < visibleSteps.length) {
      setCurrentStep(visibleSteps[index].key)
    }
  }

  const handlePrev = () => goToStep(activeIndex - 1)
  const handleNext = () => {
    if (activeIndex === visibleSteps.length - 1) {
      finalizeCampaign()
    } else {
      goToStep(activeIndex + 1)
    }
  }

  const finalizeCampaign = async () => {
    if (!campaignId) {
      setFinalMessage('Error: Campaign ID not found')
      return
    }
    setFinalizing(true)
    setFinalMessage(null)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/finalize`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to finalize')
      }
      setFinalMessage('Campaign finalized and synced successfully!')
      // Refresh the page or navigate after a short delay
      setTimeout(() => {
        window.location.href = `/client/campaigns/${campaignId}`
      }, 2000)
    } catch (error: any) {
      console.error('Finalize error:', error)
      setFinalMessage(`Error: ${error.message || 'Failed to finalize campaign'}`)
    } finally {
      setFinalizing(false)
    }
  }

  const generateSummary = async () => {
    setSummaryLoading(true)
    try {
      const response = await fetch('/api/campaigns/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign }),
      })
      const data = await response.json()
      if (data.summary) {
        setAISummary(data.summary)
      }
    } finally {
      setSummaryLoading(false)
    }
  }

  const insights = useMemo(() => {
    return [
      `Status: ${campaignStatus || 'draft'}`,
      `Respondents: ${campaign.scale.respondents || 0}`,
      `Reward budget: $${campaign.rewards.computedTotalBudget?.toFixed(2) || '0.00'}`,
    ]
  }, [campaignStatus, campaign.scale.respondents, campaign.rewards.computedTotalBudget])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0c14] p-10 text-white">Preparing campaign builder...</div>
    )
  }

  const stepSpecificProps =
    activeStep.key === 'summary'
      ? {
          summary: aiSummary,
          onSummaryChange: (value: string) => setAISummary(value),
          onGenerateSummary: generateSummary,
          generating: summaryLoading,
        }
      : {}

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(14,165,233,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-200">
              {mode === 'internal' ? 'Internal campaign' : 'Client campaign'}
            </p>
            <h1 className="text-4xl font-semibold text-white">
              {campaign.overview.campaignName || campaignName || 'TruAfrica Campaign Builder'}
            </h1>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>Autosave: {autoSaveStatus}</p>
            {finalMessage && <p className="text-emerald-300">{finalMessage}</p>}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4 overflow-x-auto">
          {visibleSteps.map((step, index) => (
            <button
              key={step.key}
              onClick={() => goToStep(index)}
              className={cn(
                'flex min-w-[140px] flex-col rounded-2xl border px-4 py-3 text-left transition-all',
                index === activeIndex
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-white'
                  : 'border-white/10 text-slate-300'
              )}
            >
              <span className="text-xs uppercase tracking-[0.3em]">Step {index + 1}</span>
              <span className="text-sm font-semibold">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr,1.2fr]">
        <div className="space-y-6">
          <StepContainer title={activeStep.title} subtitle={activeStep.subtitle}>
            <StepComponent {...stepSpecificProps} />
          </StepContainer>

          <div className="sticky bottom-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
            <div className="text-sm text-slate-200">
              {activeIndex + 1} / {visibleSteps.length} — {activeStep.title}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/30 text-white"
                onClick={handlePrev}
                disabled={activeIndex === 0 || finalizing}
              >
                Back
              </Button>
              <Button
                className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30"
                onClick={handleNext}
                disabled={finalizing}
              >
                {activeIndex === visibleSteps.length - 1 ? (finalizing ? 'Finalizing...' : 'Finalize') : 'Next'}
              </Button>
            </div>
          </div>
        </div>

        <AIHelperSidebar
          currentStep={activeStep.key}
          autoSaveStatus={autoSaveStatus}
          campaignName={campaign.overview.campaignName || campaignName}
          summary={aiSummary}
          summaryLoading={summaryLoading}
          onGenerateSummary={generateSummary}
          insights={insights}
        />
      </div>
    </div>
  )
}

