'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DifficultyLevel } from '@/types/database'

interface ExpertiseField {
  id: string
  name: string
  description: string | null
}

interface QuestionUploadFormProps {
  fields: ExpertiseField[]
  onSubmit: (data: {
    fieldId: string
    content: string
    difficultyLevel: DifficultyLevel
  }) => void
  submitting?: boolean
}

export function QuestionUploadForm({ fields, onSubmit, submitting = false }: QuestionUploadFormProps) {
  const [fieldId, setFieldId] = useState('')
  const [content, setContent] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('easy')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fieldId || !content.trim()) {
      return
    }
    onSubmit({
      fieldId,
      content: content.trim(),
      difficultyLevel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="field">Expertise Field *</Label>
        <Select value={fieldId} onValueChange={setFieldId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select an expertise field" />
          </SelectTrigger>
          <SelectContent>
            {fields.map(field => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
                {field.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    - {field.description}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty Level *</Label>
        <Select
          value={difficultyLevel}
          onValueChange={(value) => setDifficultyLevel(value as DifficultyLevel)}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Easy: Basic questions, Medium: Intermediate complexity, Hard: Advanced topics
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Question Content *</Label>
        <Textarea
          id="content"
          placeholder="Enter your question here. Be specific and clear about what you're asking..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          {content.length} characters
        </p>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting || !fieldId || !content.trim()}>
          {submitting ? 'Submitting...' : 'Submit Question'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFieldId('')
            setContent('')
            setDifficultyLevel('easy')
          }}
        >
          Clear
        </Button>
      </div>
    </form>
  )
}

