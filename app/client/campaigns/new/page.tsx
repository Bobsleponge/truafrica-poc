'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { CampaignWizard, type CampaignWizardData } from '@/components/client/CampaignWizard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewCampaignPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadFields()
    }
  }, [user, authLoading])

  const loadFields = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('expertise_fields')
        .select('id, name')
        .order('name')

      if (fetchError) throw fetchError
      setFields(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load fields')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: CampaignWizardData) => {
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          objective: data.objective,
          targetCountries: data.targetCountries,
          targetDemo: data.targetDemo,
          brief: {
            goals: data.objective,
            keyQuestions: data.questions.map(q => q.content || ''),
            constraints: '',
            languages: [],
            budget: null,
            timeline: null,
          },
          questions: data.questions.map(q => ({
            questionId: q.questionId,
            content: q.content,
            fieldId: q.fieldId,
            questionType: q.questionType,
            complexityLevel: q.complexityLevel,
            requiredResponses: q.requiredResponses,
          })),
          urgency: data.urgency,
          needsQuestionDesign: data.needsQuestionDesign,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/client/campaigns/${result.campaign.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign')
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Create New Campaign</h1>
          <p className="text-muted-foreground">Set up a new data collection campaign</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Campaign created successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <CampaignWizard
          onSubmit={handleSubmit}
          submitting={submitting}
          expertiseFields={fields}
        />
      </div>
    </div>
  )
}


