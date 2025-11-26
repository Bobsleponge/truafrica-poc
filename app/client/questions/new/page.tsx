'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuestionUploadForm } from '@/components/client/QuestionUploadForm'
import type { DifficultyLevel } from '@/types/database'

interface ExpertiseField {
  id: string
  name: string
  description: string | null
}

export default function NewQuestionPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [fields, setFields] = useState<ExpertiseField[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
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
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      setFields(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load fields')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: {
    fieldId: string
    content: string
    difficultyLevel: DifficultyLevel
  }) => {
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: questionData, error: insertError } = await supabase
        .from('questions')
        .insert({
          client_id: user!.id,
          field_id: data.fieldId,
          content: data.content,
          difficulty_level: data.difficultyLevel,
          status: 'active',
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/client/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create question')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Question</CardTitle>
            <CardDescription>
              Submit a question for African contributors to answer. This will help validate your AI tools and models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  Question created successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            <QuestionUploadForm
              fields={fields}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

