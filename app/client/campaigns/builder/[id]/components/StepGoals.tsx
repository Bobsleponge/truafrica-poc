'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import type { GoalModality } from '@/types/campaign-journey'
import { cn } from '@/lib/utils'

const GOAL_OPTIONS: Array<{ key: GoalModality; label: string; description: string }> = [
  { key: 'behaviour', label: 'Behaviour dataset', description: 'Capture sequences, logs, or action trails.' },
  { key: 'reasoning', label: 'Reasoning dataset', description: 'Structured prompts that test logic.' },
  { key: 'audio', label: 'Audio dataset', description: 'Speech and audio corpora collection.' },
  { key: 'image', label: 'Image dataset', description: 'Visual QA, labeling, or classification.' },
  { key: 'validation', label: 'Validation / annotation', description: 'Human verification of AI outputs.' },
  { key: 'fine_tuning', label: 'Fine-tuning prep', description: 'High-quality aligned samples.' },
]

export function StepGoals() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)
  const setPrimaryGoal = useCampaignBuilderStore((state) => state.setPrimaryGoal)

  const selectedModality = campaign.goals.primaryGoal || 'behaviour'
  const modalityDetail = campaign.goals.modalityDetails[selectedModality] || {}

  const secondaryGoals = campaign.goals.secondaryGoals || []

  const toggleSecondary = (goal: GoalModality) => {
    if (goal === campaign.goals.primaryGoal) return
    if (secondaryGoals.includes(goal)) {
      setField(
        'goals',
        'secondaryGoals',
        secondaryGoals.filter((item) => item !== goal)
      )
    } else {
      setField('goals', 'secondaryGoals', [...secondaryGoals, goal])
    }
  }

  const updateModalityDetail = (field: string, value: string | string[]) => {
    const nextDetails = {
      ...campaign.goals.modalityDetails,
      [selectedModality]: {
        ...(campaign.goals.modalityDetails[selectedModality] || {}),
        [field]: value,
      },
    }
    setField('goals', 'modalityDetails', nextDetails)
  }

  const detailPlaceholders = useMemo(() => {
    if (selectedModality === 'audio') {
      return {
        datasetDescription: 'e.g., "Swahili speech patterns for voice recognition training in Kenyan accents"',
        inputs: 'e.g., Audio prompts\nScenario scripts\nTone instructions',
        outputs: 'e.g., WAV files\nTranscribed text\nPhonetic annotations',
      }
    }
    if (selectedModality === 'image') {
      return {
        datasetDescription: 'e.g., "Retail storefront images for brand recognition model training"',
        inputs: 'e.g., Product photos\nStore images\nReceipt scans',
        outputs: 'e.g., Bounding boxes\nLabels\nClassifications',
      }
    }
    if (selectedModality === 'behaviour') {
      return {
        datasetDescription: 'e.g., "Mobile money transaction patterns and decision factors"',
        inputs: 'e.g., Transaction scenarios\nProduct descriptions\nChoice prompts',
        outputs: 'e.g., Action sequences\nDecision logs\nBehavioral patterns',
      }
    }
    if (selectedModality === 'reasoning') {
      return {
        datasetDescription: 'e.g., "Logical reasoning capabilities for problem-solving tasks"',
        inputs: 'e.g., Problem statements\nContext scenarios\nQuestion prompts',
        outputs: 'e.g., Step-by-step reasoning\nFinal answers\nConfidence scores',
      }
    }
    if (selectedModality === 'validation') {
      return {
        datasetDescription: 'e.g., "Human verification of AI-generated medical advice accuracy"',
        inputs: 'e.g., AI responses to verify\nOriginal questions\nContext information',
        outputs: 'e.g., Accuracy ratings\nCorrections\nExpert annotations',
      }
    }
    if (selectedModality === 'fine_tuning') {
      return {
        datasetDescription: 'e.g., "High-quality instruction-following examples for LLM fine-tuning"',
        inputs: 'e.g., Instruction prompts\nContext examples\nTask descriptions',
        outputs: 'e.g., Aligned responses\nFormatted training data\nQuality scores',
      }
    }
    return {
      datasetDescription: 'e.g., "Consumer insights for product development in African markets"',
      inputs: 'e.g., Product concepts\nSurvey prompts\nStimuli materials',
      outputs: 'e.g., Ratings\nText responses\nStructured data',
    }
  }, [selectedModality])

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {GOAL_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPrimaryGoal(option.key)}
            className={cn(
              'rounded-3xl border p-4 text-left transition-all duration-300',
              campaign.goals.primaryGoal === option.key
                ? 'border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/20 text-white shadow-lg shadow-fuchsia-500/20'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-fuchsia-400/40'
            )}
          >
            <p className="text-lg font-semibold">{option.label}</p>
            <p className="text-sm text-slate-300">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Delegation</p>
            <p className="text-white/90">Should TruAfrica design your questions?</p>
          </div>
          <Button
            variant="outline"
            className={cn(
              'border-white/30 text-white',
              campaign.goals.truafricaBuildsQuestions && 'bg-white/20'
            )}
            onClick={() => setField('goals', 'truafricaBuildsQuestions', !campaign.goals.truafricaBuildsQuestions)}
          >
            {campaign.goals.truafricaBuildsQuestions ? 'Yes, TruAfrica designs' : 'No, we will design'}
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Blueprint</p>
          <p className="text-sm text-slate-400">
            Help our AI understand your data needs. This information powers question generation and campaign design.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-200">What data are you collecting?</Label>
              <p className="text-xs text-slate-400">
                Describe the type of intelligence or insights you need from this dataset.
              </p>
            </div>
            <Textarea
              value={modalityDetail.datasetDescription || ''}
              onChange={(event) => updateModalityDetail('datasetDescription', event.target.value)}
              placeholder={detailPlaceholders.datasetDescription}
              className="min-h-[120px] border-white/10 bg-black/20 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-slate-500 italic">
              Example: "Consumer purchase decision patterns for mobile money services in urban Kenya"
            </p>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-200">What will contributors see or receive?</Label>
              <p className="text-xs text-slate-400">
                List prompts, images, audio clips, or scenarios you'll provide to respondents. One per line.
              </p>
            </div>
            <Textarea
              value={(modalityDetail.inputs || []).join('\n')}
              onChange={(event) => updateModalityDetail('inputs', event.target.value.split('\n').filter(Boolean))}
              placeholder={detailPlaceholders.inputs}
              className="min-h-[120px] border-white/10 bg-black/20 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-slate-500 italic">
              Example: "Product images" or "Audio clip of customer service call"
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-200">What format should responses be in?</Label>
              <p className="text-xs text-slate-400">
                Describe the structured output you need. One format per line.
              </p>
            </div>
            <Textarea
              value={(modalityDetail.outputs || []).join('\n')}
              onChange={(event) => updateModalityDetail('outputs', event.target.value.split('\n').filter(Boolean))}
              placeholder={detailPlaceholders.outputs}
              className="min-h-[120px] border-white/10 bg-black/20 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-slate-500 italic">
              Example: "JSON with ratings" or "Transcribed text with timestamps"
            </p>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-200">Quality checks needed?</Label>
              <p className="text-xs text-slate-400">
                Describe any human verification, annotation, or validation steps required.
              </p>
            </div>
            <Textarea
              value={modalityDetail.validationNeeds || ''}
              onChange={(event) => updateModalityDetail('validationNeeds', event.target.value)}
              placeholder="Describe human validation or annotation steps."
              className="min-h-[120px] border-white/10 bg-black/20 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-slate-500 italic">
              Example: "Expert review of medical terminology" or "Cross-validate with ground truth data"
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.4em] text-slate-200">Secondary modalities</Label>
        <div className="flex flex-wrap gap-3">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={`secondary-${option.key}`}
              type="button"
              onClick={() => toggleSecondary(option.key)}
              className={cn(
                'rounded-full px-4 py-2 text-sm transition-all',
                secondaryGoals.includes(option.key)
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-slate-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

