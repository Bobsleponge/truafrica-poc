'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuestionCard } from '@/components/contributor/QuestionCard'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Particles } from '@/components/ui/Particles'
import { motion } from 'framer-motion'
import { Filter, Sparkles } from 'lucide-react'
import type { Question, DifficultyLevel } from '@/types/database'

export default function QuestionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [questions, setQuestions] = useState<(Question & { field_name?: string })[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<(Question & { field_name?: string }) | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterField, setFilterField] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [expertiseFields, setExpertiseFields] = useState<{ id: string; name: string }[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      loadData()
    }
  }, [user, authLoading])

  const loadData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (profileError) throw profileError
      setUserProfile(profileData)

      if (!profileData.onboarding_completed) {
        router.push('/contributor/onboarding')
        return
      }

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('expertise_fields')
        .select('id, name')
        .order('name')

      if (fieldsError) throw fieldsError
      setExpertiseFields(fieldsData || [])

      await loadQuestions()
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      // First, get all campaign_questions for running campaigns
      const { data: runningCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'running')

      if (campaignsError) throw campaignsError

      const runningCampaignIds = (runningCampaigns || []).map((c: any) => c.id)

      // Get question IDs from running campaigns
      let questionIds: string[] = []
      if (runningCampaignIds.length > 0) {
        const { data: campaignQuestions, error: cqError } = await supabase
          .from('campaign_questions')
          .select('question_id')
          .in('campaign_id', runningCampaignIds)

        if (cqError) throw cqError
        questionIds = (campaignQuestions || []).map((cq: any) => cq.question_id)
      }

      // If no running campaigns, return empty
      if (questionIds.length === 0) {
        setQuestions([])
        return
      }

      // Get questions that are in running campaigns
      let query = supabase
        .from('questions')
        .select(`
          *,
          expertise_fields:field_id (
            name
          )
        `)
        .eq('status', 'active')
        .in('id', questionIds)
        .order('created_at', { ascending: false })

      const { data, error: questionsError } = await query

      if (questionsError) throw questionsError

      const filtered = (data || []).filter((q: any) => {
        return true
      }).map((q: any) => ({
        ...q,
        field_name: q.expertise_fields?.name,
      }))

      const { data: answeredQuestions } = await supabase
        .from('answers')
        .select('question_id')
        .eq('contributor_id', user!.id)

      const answeredIds = new Set((answeredQuestions || []).map((a: any) => a.question_id))
      const available = filtered.filter((q: any) => !answeredIds.has(q.id))

      let filteredQuestions = available
      if (filterField !== 'all') {
        filteredQuestions = filteredQuestions.filter((q: any) => q.field_id === filterField)
      }
      if (filterDifficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter((q: any) => q.difficulty_level === filterDifficulty)
      }

      setQuestions(filteredQuestions)
    } catch (err: any) {
      setError(err.message || 'Failed to load questions')
    }
  }

  useEffect(() => {
    if (user && userProfile) {
      loadQuestions()
    }
  }, [filterField, filterDifficulty, user, userProfile])

  const handleAnswerClick = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      setSelectedQuestion(question)
      setAnswer('')
      setError(null)
      setSuccess(null)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      setError('Please provide an answer')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .insert({
          question_id: selectedQuestion.id,
          contributor_id: user!.id,
          answer_text: answer.trim(),
        })
        .select()
        .single()

      if (answerError) throw answerError

      const response = await fetch('/api/answers/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId: answerData.id, questionId: selectedQuestion.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate consensus')
      }

      const consensusData = await response.json()

      if (!consensusData.success) {
        throw new Error(consensusData.error || 'Failed to calculate consensus')
      }

      setSuccess(
        consensusData.answer.correct
          ? 'Answer submitted successfully! Your answer was correct and you earned a reward!'
          : 'Answer submitted successfully! Consensus calculation completed.'
      )
      setSelectedQuestion(null)
      setAnswer('')
      
      setTimeout(() => {
        loadQuestions()
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading questions...</div>
      </div>
    )
  }

  const difficultyConfig = {
    easy: 'difficulty-easy',
    medium: 'difficulty-medium',
    hard: 'difficulty-hard',
  }

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      <Particles count={20} />
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 gradient-text" />
            <h1 className="text-3xl font-bold gradient-text">Available Questions</h1>
          </div>
          <p className="text-muted-foreground">Answer questions in your area of expertise to earn rewards</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Field</label>
                  <Select value={filterField} onValueChange={setFilterField}>
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="All Fields" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      {expertiseFields.map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Difficulty</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-[#00E676]/10 border-[#00E676]/30">
            <AlertDescription className="text-[#00E676]">{success}</AlertDescription>
          </Alert>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No available questions at the moment. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question: any, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <QuestionCard
                  question={question}
                  onAnswer={handleAnswerClick}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Answer Dialog */}
        <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="gradient-text">Answer Question</DialogTitle>
              <DialogDescription>
                {selectedQuestion && (
                  <>
                    <div className="mt-2 space-y-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-border/50">
                        {selectedQuestion.field_name}
                      </Badge>
                      <Badge className={`${difficultyConfig[selectedQuestion.difficulty_level as keyof typeof difficultyConfig]} border`}>
                        {selectedQuestion.difficulty_level}
                      </Badge>
                    </div>
                    <p className="mt-4 text-base font-medium">{selectedQuestion.content}</p>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Answer</label>
                <Textarea
                  placeholder="Provide a detailed answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px] bg-input/50 border-border/50 focus:border-primary"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuestion(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                  variant="gradient"
                  className="glow-hover"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
