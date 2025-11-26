'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'

const INDUSTRY_OPTIONS = [
  'Financial Services',
  'Telecommunications',
  'E-commerce',
  'Public Sector',
  'Healthcare',
  'Energy',
  'Technology',
]

export function StepOverview() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Campaign name</Label>
        <Input
          value={campaign.overview.campaignName || ''}
          onChange={(event) => setField('overview', 'campaignName', event.target.value)}
          placeholder="e.g. Africa Agent Benchmark 2025"
          className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Company</Label>
        <Input
          value={campaign.overview.companyName || ''}
          onChange={(event) => setField('overview', 'companyName', event.target.value)}
          placeholder="TruAfrica Labs"
          className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Industry</Label>
        <select
          value={campaign.overview.industry || ''}
          onChange={(event) => setField('overview', 'industry', event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-fuchsia-400"
        >
          <option value="" className="bg-slate-900 text-slate-300">
            Select industry
          </option>
          {INDUSTRY_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-slate-900 text-white">
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Internal owner</Label>
        <Input
          value={campaign.overview.internalOwner || ''}
          onChange={(event) => setField('overview', 'internalOwner', event.target.value)}
          placeholder="Name or squad"
          className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
        />
      </div>
      <div className="md:col-span-2 space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Objective</Label>
        <Textarea
          value={campaign.overview.oneLineObjective || ''}
          onChange={(event) => setField('overview', 'oneLineObjective', event.target.value)}
          placeholder="Summarize the intent in a single sentence."
          className="min-h-[90px] border-white/10 bg-black/30 text-white placeholder:text-white/40"
        />
      </div>
    </div>
  )
}

