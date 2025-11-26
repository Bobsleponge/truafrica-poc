'use client'

import { AlertTriangle } from 'lucide-react'
import { QuestionEditor } from './QuestionEditor'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'

export function StepQuestions() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)
  const branching = useCampaignBuilderStore((state) => state.branching)

  if (!branching.shouldShowQuestionBuilder) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-emerald-100">
        <AlertTriangle className="h-5 w-5" />
        TruAfrica’s research team will design the question set. You can still review the AI summary in Step 8.
      </div>
    )
  }

  return (
    <QuestionEditor
      questions={campaign.questions}
      onChange={(next) => setField('questions', 'list', next)}
      preferredTypes={branching.preferredQuestionTypes}
      disabledTypes={branching.disabledQuestionTypes}
    />
  )
}

