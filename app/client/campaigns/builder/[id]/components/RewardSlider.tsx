'use client'

import { cn } from '@/lib/utils'
import type { RewardFairnessMode } from '@/types/campaign-journey'

const FAIRNESS_OPTIONS: Array<{
  label: string
  value: RewardFairnessMode
  blurb: string
}> = [
  { label: 'Low', value: 'low', blurb: 'Lean payouts for exploratory runs.' },
  { label: 'Balanced', value: 'balanced', blurb: 'Optimized ROI with happy contributors.' },
  { label: 'Premium', value: 'premium', blurb: 'High-attraction rewards for complex tasks.' },
]

interface RewardSliderProps {
  value: RewardFairnessMode
  onChange: (value: RewardFairnessMode) => void
  range: { min: number; max: number }
}

export function RewardSlider({ value, onChange, range }: RewardSliderProps) {
  const currentIndex = FAIRNESS_OPTIONS.findIndex((option) => option.value === value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-purple-200/70">
        <span>Fairness mode</span>
        <span>
          {range.min.toFixed(2)} - {range.max.toFixed(2)} {value === 'low' ? 'USD eq.' : 'Reward units'}
        </span>
      </div>
      <div className="relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <input
          type="range"
          min={0}
          max={FAIRNESS_OPTIONS.length - 1}
          step={1}
          value={currentIndex}
          onChange={(event) => {
            const index = Number(event.target.value)
            const next = FAIRNESS_OPTIONS[index]
            if (next) onChange(next.value)
          }}
          className="h-1 w-full appearance-none rounded-full bg-white/20 accent-fuchsia-400"
        />
        <div className="grid grid-cols-3 gap-4 text-center text-sm font-semibold text-slate-200">
          {FAIRNESS_OPTIONS.map((option, index) => (
            <div
              key={option.value}
              className={cn(
                'rounded-2xl border border-white/10 p-3 transition-all duration-300',
                option.value === value
                  ? 'bg-gradient-to-r from-fuchsia-600/60 to-indigo-600/60 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-300'
              )}
            >
              <p>{option.label}</p>
              <p className="text-xs font-normal text-white/70">{option.blurb}</p>
              <div className="mt-3 text-xs font-mono uppercase tracking-widest text-white/80">
                {index === 0 && '0.85x base'}
                {index === 1 && '1.0x base'}
                {index === 2 && '1.35x base'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

