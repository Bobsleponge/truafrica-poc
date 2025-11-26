'use client'

import { useEffect, useMemo } from 'react'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import { computeRewardSummary } from '@/lib/campaign/rewardEngine'
import { POINTS_TO_USD_RATE, POINTS_PER_DOLLAR } from '@/types/campaign-journey'

export function StepRewards() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)

  // Calculate points based on questions and complexity
  // Standard rate: 1 point = $0.01 USD (10 points = $0.10)
  const rewardSummary = useMemo(
    () => computeRewardSummary(campaign),
    [campaign.questions, campaign.scale.respondents]
  )

  // Convert USD amounts to points (using standard 1 point = $0.01)
  const pointsPerQuestion = Math.round(rewardSummary.perQuestionReward / POINTS_TO_USD_RATE)
  const pointsPerRespondent = Math.round(rewardSummary.perRespondentReward / POINTS_TO_USD_RATE)
  const totalPoints = Math.round(rewardSummary.totalBudget / POINTS_TO_USD_RATE)

  useEffect(() => {
    setField('rewards', 'computedPointsPerQuestion', pointsPerQuestion)
    setField('rewards', 'computedPointsPerRespondent', pointsPerRespondent)
    setField('rewards', 'computedTotalPoints', totalPoints)
  }, [pointsPerQuestion, pointsPerRespondent, totalPoints, setField])

  const usdEquivalent = (points: number) => (points * POINTS_TO_USD_RATE).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Standard Points System</p>
          <p className="text-sm text-slate-400">
            Contributors earn points based on question complexity. They can redeem points for airtime, data, mobile money, or other rewards of their choice.
          </p>
          <div className="mt-4 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4">
            <p className="text-sm font-semibold text-fuchsia-200">Exchange Rate</p>
            <p className="text-2xl font-bold text-white">
              10 points = ${usdEquivalent(10)}
            </p>
            <p className="text-xs text-slate-400 mt-1">(1 point = ${usdEquivalent(1)})</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Points per question</p>
          <p className="text-3xl font-semibold text-white">
            {pointsPerQuestion}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ≈ ${usdEquivalent(pointsPerQuestion)} USD
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Points per respondent</p>
          <p className="text-3xl font-semibold text-white">
            {pointsPerRespondent}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ≈ ${usdEquivalent(pointsPerRespondent)} USD
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Total points budget</p>
          <p className="text-3xl font-semibold text-white">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ≈ ${usdEquivalent(totalPoints)} USD
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300 mb-4">How it works</p>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" />
            <div>
              <p className="font-semibold text-white">Automatic calculation</p>
              <p className="text-slate-400">Points are calculated based on question type and complexity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" />
            <div>
              <p className="font-semibold text-white">Contributor choice</p>
              <p className="text-slate-400">Contributors choose how to redeem their points (airtime, data, mobile money, etc.)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" />
            <div>
              <p className="font-semibold text-white">Standard rate</p>
              <p className="text-slate-400">10 points = $0.10 USD across all reward types</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
