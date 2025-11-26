'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Particles } from '@/components/ui/Particles'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateInitialTrustScore } from '@/lib/utils/trustScore'
import { Sparkles, CheckCircle2, TrendingUp, AlertCircle, Zap, Award } from 'lucide-react'
import { RadialProgress } from '@/components/ui/radial-progress'
import type { DifficultyLevel } from '@/types/database'

interface OnboardingQuestion {
  id: string
  content: string
  difficulty_level: DifficultyLevel
  field_id: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [finalTrustScore, setFinalTrustScore] = useState<number | null>(null)

  useEffect(() => {
    loadOnboardingQuestions()
  }, [])

  const loadOnboardingQuestions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('expertise_fields')
        .select('id')
        .limit(1)

      if (fetchError) throw fetchError

      const sampleQuestions: OnboardingQuestion[] = [
        {
          id: 'onboarding-1',
          content: 'What is the primary challenge facing small-scale farmers in Africa today?',
          difficulty_level: 'easy',
          field_id: data?.[0]?.id || '',
        },
        {
          id: 'onboarding-2',
          content: 'How can mobile technology improve access to financial services in rural Africa?',
          difficulty_level: 'easy',
          field_id: data?.[0]?.id || '',
        },
        {
          id: 'onboarding-3',
          content: 'Describe the impact of climate change on agricultural productivity in your region.',
          difficulty_level: 'medium',
          field_id: data?.[0]?.id || '',
        },
        {
          id: 'onboarding-4',
          content: 'What are the main barriers to internet connectivity in African communities?',
          difficulty_level: 'medium',
          field_id: data?.[0]?.id || '',
        },
        {
          id: 'onboarding-5',
          content: 'Explain how renewable energy solutions can address power shortages in African cities.',
          difficulty_level: 'hard',
          field_id: data?.[0]?.id || '',
        },
      ]

      setQuestions(sampleQuestions)
    } catch (err: any) {
      setError(err.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let correctCount = 0
      for (const answer of Object.values(answers)) {
        if (answer.trim().length >= 50) {
          correctCount++
        }
      }

      const trustScore = calculateInitialTrustScore(correctCount, questions.length)
      setFinalTrustScore(trustScore)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          trust_score: trustScore,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setCompleted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit onboarding')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = () => {
    router.push('/contributor/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading onboarding questions...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1
  const allAnswered = questions.every(q => answers[q.id]?.trim())

  const difficultyConfig = {
    easy: { color: 'difficulty-easy', icon: <TrendingUp className="h-4 w-4" />, label: 'Easy' },
    medium: { color: 'difficulty-medium', icon: <AlertCircle className="h-4 w-4" />, label: 'Medium' },
    hard: { color: 'difficulty-hard', icon: <Zap className="h-4 w-4" />, label: 'Hard' },
  }

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      <Particles count={30} />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
            <div className="relative">
              {!completed ? (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-6 w-6 gradient-text" />
                      <DialogTitle className="text-2xl gradient-text">Onboarding Test</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                      Answer these questions to determine your initial trust score. This will help us match you with appropriate questions.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono text-muted-foreground">
                          Question {currentIndex + 1} of {questions.length}
                        </span>
                      </div>
                      <Progress value={progress} variant="gradient" glow />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentQuestion && (
                          <Card className="border-border/50">
                            <CardHeader>
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={`${difficultyConfig[currentQuestion.difficulty_level].color} border flex items-center gap-1`}>
                                  {difficultyConfig[currentQuestion.difficulty_level].icon}
                                  <span>{difficultyConfig[currentQuestion.difficulty_level].label}</span>
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Award className="h-4 w-4 reward-success" />
                                  <span className="reward-success font-mono">
                                    {currentQuestion.difficulty_level === 'easy' ? '+10' : currentQuestion.difficulty_level === 'medium' ? '+15' : '+25'} pts
                                  </span>
                                </div>
                              </div>
                              <CardTitle className="text-lg">{currentQuestion.content}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                placeholder="Type your answer here... (minimum 50 characters)"
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                className="min-h-[200px] bg-input/50 border-border/50 focus:border-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {answers[currentQuestion.id]?.length || 0} characters
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                      >
                        Previous
                      </Button>
                      {isLastQuestion ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={!allAnswered || submitting}
                          variant="gradient"
                          className="glow-hover"
                        >
                          {submitting ? 'Submitting...' : 'Complete Onboarding'}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleNext}
                          variant="gradient"
                          className="glow-hover"
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6 py-8"
                >
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle2 className="h-20 w-20 text-[#00E676] neon-glow-green" />
                    </motion.div>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-bold gradient-text mb-2">Onboarding Complete!</h2>
                    <p className="text-muted-foreground">Your trust score has been calculated</p>
                  </div>

                  {finalTrustScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-center"
                    >
                      <div className="space-y-4">
                        <RadialProgress
                          value={finalTrustScore}
                          max={100}
                          size={150}
                          strokeWidth={12}
                          color={finalTrustScore >= 80 ? 'success' : finalTrustScore >= 60 ? 'primary' : 'warning'}
                          glow={finalTrustScore >= 80}
                        />
                        <div>
                          <p className="text-2xl font-bold gradient-text">{finalTrustScore.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">Initial Trust Score</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-2"
                  >
                    <Badge className="gradient-primary text-white border-0">Expert Contributor</Badge>
                    <Badge className="gradient-primary text-white border-0">Rewards Enabled</Badge>
                    <Badge className="gradient-primary text-white border-0">Questions Unlocked</Badge>
                  </motion.div>

                  <Button
                    onClick={handleComplete}
                    variant="gradient"
                    size="lg"
                    className="glow-hover mt-6"
                  >
                    Go to Dashboard
                  </Button>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
