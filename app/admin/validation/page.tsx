'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface FlaggedAnswer {
  id: string
  answer_id: string
  reason: string
  status: string
  answers: {
    id: string
    answer_text: string
    consensus_score: number | null
    validation_confidence_score: number | null
    correct: boolean | null
    questions: {
      id: string
      content: string
    }
    users: {
      id: string
      name: string
      trust_score: number
    }
  }
}

export default function AdminValidationPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [flaggedAnswers, setFlaggedAnswers] = useState<FlaggedAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState<FlaggedAnswer | null>(null)
  const [resolution, setResolution] = useState<'resolved' | 'invalid'>('resolved')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      loadFlaggedAnswers()
    }
  }, [user, authLoading])

  const loadFlaggedAnswers = async () => {
    try {
      const response = await fetch('/api/validation/human?status=pending')
      const data = await response.json()

      if (data.success) {
        setFlaggedAnswers(data.flaggedAnswers || [])
      }
    } catch (err: any) {
      console.error('Error loading flagged answers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedAnswer) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/validation/human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flaggedAnswerId: selectedAnswer.id,
          resolution,
          notes,
          correct: resolution === 'resolved',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedAnswer(null)
        setNotes('')
        loadFlaggedAnswers()
      } else {
        alert(data.error || 'Failed to resolve answer')
      }
    } catch (error) {
      console.error('Error resolving answer:', error)
      alert('Failed to resolve answer')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Human Validation Queue</h1>
          <p className="text-muted-foreground">
            Review and resolve flagged answers that need human validation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Flagged Answers List */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Flagged Answers ({flaggedAnswers.length})</CardTitle>
              <CardDescription>Answers requiring human review</CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedAnswers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No flagged answers</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {flaggedAnswers.map((flagged) => (
                    <div
                      key={flagged.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedAnswer?.id === flagged.id ? 'border-primary' : 'border-border/50'
                      }`}
                      onClick={() => setSelectedAnswer(flagged)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {flagged.answers.questions.content.substring(0, 60)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Trust Score: {flagged.answers.users.trust_score.toFixed(1)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {flagged.reason}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Answer: {flagged.answers.answer_text.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution Panel */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Resolve Answer</CardTitle>
              <CardDescription>
                {selectedAnswer ? 'Review and resolve the selected answer' : 'Select an answer to resolve'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAnswer ? (
                <div className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <p className="text-sm bg-muted p-3 rounded mt-1">
                      {selectedAnswer.answers.questions.content}
                    </p>
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <p className="text-sm bg-muted p-3 rounded mt-1">
                      {selectedAnswer.answers.answer_text}
                    </p>
                  </div>
                  <div>
                    <Label>Flag Reason</Label>
                    <Badge variant="outline" className="mt-1">
                      {selectedAnswer.reason}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Consensus Score</Label>
                      <p className="text-sm">
                        {selectedAnswer.answers.consensus_score?.toFixed(1) || 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <Label>Validation Confidence</Label>
                      <p className="text-sm">
                        {selectedAnswer.answers.validation_confidence_score?.toFixed(1) || 'N/A'}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Resolution</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={resolution === 'resolved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResolution('resolved')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Valid
                      </Button>
                      <Button
                        variant={resolution === 'invalid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResolution('invalid')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Invalid
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="mt-1"
                      placeholder="Add any notes about this resolution..."
                    />
                  </div>
                  <Button
                    onClick={handleResolve}
                    disabled={submitting}
                    variant="gradient"
                    className="w-full"
                  >
                    {submitting ? 'Resolving...' : 'Resolve Answer'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select an answer to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




