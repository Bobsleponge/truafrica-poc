'use client'

import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import type { CampaignQuestion, QuestionKind } from '@/types/campaign-journey'
import { cn } from '@/lib/utils'

const QUESTION_TYPES: Array<{ label: string; value: QuestionKind }> = [
  { label: 'Multiple Choice', value: 'mcq' },
  { label: 'Single Choice', value: 'single_choice' },
  { label: 'Short Text', value: 'short_text' },
  { label: 'Long Text', value: 'long_text' },
  { label: 'Rating', value: 'rating' },
  { label: 'Audio Upload', value: 'audio' },
  { label: 'Image Upload', value: 'image' },
  { label: 'Video Prompt', value: 'video' },
]

const detectComplexity = (content: string) => {
  if (content.length > 180) return 'complex'
  if (content.length > 80) return 'balanced'
  return 'simple'
}

const createQuestion = (preferred?: QuestionKind): CampaignQuestion => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  type: preferred || 'short_text',
  options: [],
  reward: 1.0,
  complexity: 'simple',
  required: true,
})

interface QuestionEditorProps {
  questions: CampaignQuestion[]
  onChange: (questions: CampaignQuestion[]) => void
  preferredTypes?: QuestionKind[]
  disabledTypes?: QuestionKind[]
}

export function QuestionEditor({
  questions,
  onChange,
  preferredTypes,
  disabledTypes = [],
}: QuestionEditorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateQuestion = (id: string, updates: Partial<CampaignQuestion>) => {
    onChange(questions.map((question) => (question.id === id ? { ...question, ...updates } : question)))
  }

  const updateOption = (id: string, index: number, value: string) => {
    onChange(
      questions.map((question) => {
        if (question.id !== id) return question
        const nextOptions = [...(question.options || [])]
        nextOptions[index] = value
        return { ...question, options: nextOptions }
      })
    )
  }

  const addOption = (id: string) => {
    onChange(
      questions.map((question) =>
        question.id === id
          ? { ...question, options: [...(question.options || []), `Option ${question.options?.length || 0 + 1}`] }
          : question
      )
    )
  }

  const removeOption = (id: string, index: number) => {
    onChange(
      questions.map((question) => {
        if (question.id !== id) return question
        const nextOptions = [...(question.options || [])]
        nextOptions.splice(index, 1)
        return { ...question, options: nextOptions }
      })
    )
  }

  const removeQuestion = (id: string) => onChange(questions.filter((question) => question.id !== id))

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get latest campaign data from store to ensure we have all updates from steps 1-3
      const latestCampaign = useCampaignBuilderStore.getState().campaign
      
      const response = await fetch('/api/campaigns/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overview: latestCampaign.overview,
          goals: latestCampaign.goals, // Includes full modalityDetails/blueprint
          audience: latestCampaign.audience,
          existingQuestions: questions, // Pass existing questions so AI can avoid duplicates
          count: Math.max(6 - questions.length, 3),
        }),
      })

      if (!response.ok) {
        throw new Error('AI generation failed')
      }

      const data = await response.json()
      const generated = (data.questions || []).map((question: CampaignQuestion) => ({
        ...question,
        id: crypto.randomUUID(),
        options: question.options || [],
        reward: question.reward || 1.2,
        complexity: question.complexity || detectComplexity(question.description || ''),
      }))

      onChange([...questions, ...generated])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to generate questions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-purple-100/70">Question builder</p>
          <p className="text-xl text-white">Design adaptive, bias-free prompts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/30 bg-white/5 text-white" onClick={handleGenerate} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4 text-fuchsia-300" />
            {loading ? 'Generating...' : 'Generate with AI'}
          </Button>
          <Button
            className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30"
            onClick={() => onChange([...questions, createQuestion(preferredTypes?.[0])])}
          >
            Add question
          </Button>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

      {questions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center text-slate-200">
          No questions yet. Generate or add manually to continue.
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => {
          const questionTypes = QUESTION_TYPES.map((type) => ({
            ...type,
            disabled: disabledTypes.includes(type.value),
          }))

          return (
            <div
              key={question.id}
              className="space-y-4 rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-6 shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-white/40 text-sm text-white">
                  Question {index + 1}
                </Badge>
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" onClick={() => removeQuestion(question.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Input
                value={question.title}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    title: event.target.value,
                    complexity: detectComplexity(event.target.value + (question.description || '')),
                  })
                }
                placeholder="Question title"
                className="bg-black/20 text-white placeholder:text-white/30"
              />

              <Textarea
                value={question.description}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    description: event.target.value,
                    complexity: detectComplexity(question.title + event.target.value),
                  })
                }
                placeholder="Why are we asking this? Provide context for contributors."
                className="bg-black/20 text-white placeholder:text-white/30"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Question type</p>
                  <select
                    value={question.type}
                    onChange={(event) => updateQuestion(question.id, { type: event.target.value as QuestionKind })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white focus:border-fuchsia-400"
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value} disabled={type.disabled} className="bg-slate-900">
                        {type.label}
                        {type.disabled ? ' (hidden)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Complexity</p>
                  <div className="flex gap-2">
                    {['simple', 'balanced', 'complex'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateQuestion(question.id, { complexity: level as CampaignQuestion['complexity'] })}
                        className={cn(
                          'flex-1 rounded-2xl border border-white/10 py-2 text-sm capitalize',
                          question.complexity === level ? 'bg-white/20 text-white' : 'text-slate-300'
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Reward weight</p>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.1}
                      value={question.reward || 1}
                      onChange={(event) => updateQuestion(question.id, { reward: Number(event.target.value) })}
                      className="w-full accent-fuchsia-400"
                    />
                    <p className="mt-2 text-sm text-slate-200">{question.reward?.toFixed(2)} credits</p>
                  </div>
                </div>
              </div>

              {(question.type === 'mcq' || question.type === 'single_choice') && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Options</p>
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <div key={`${question.id}-option-${optionIndex}`} className="flex gap-3">
                        <Input
                          value={option}
                          onChange={(event) => updateOption(question.id, optionIndex, event.target.value)}
                          className="flex-1 bg-black/20 text-white placeholder:text-white/30"
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeOption(question.id, optionIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="border-white/20 text-white" onClick={() => addOption(question.id)}>
                      Add option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

