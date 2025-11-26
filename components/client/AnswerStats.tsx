'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Question, Answer } from '@/types/database'

interface AnswerStatsProps {
  questions: (Question & { answer_count?: number })[]
  answers: Answer[]
}

export function AnswerStats({ questions, answers }: AnswerStatsProps) {
  // Calculate stats by difficulty
  const statsByDifficulty = {
    easy: {
      total: questions.filter(q => q.difficulty_level === 'easy').length,
      answered: questions.filter(q => q.difficulty_level === 'easy' && (q.answer_count || 0) > 0).length,
      correct: answers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty_level === 'easy' && a.correct === true
      }).length,
    },
    medium: {
      total: questions.filter(q => q.difficulty_level === 'medium').length,
      answered: questions.filter(q => q.difficulty_level === 'medium' && (q.answer_count || 0) > 0).length,
      correct: answers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty_level === 'medium' && a.correct === true
      }).length,
    },
    hard: {
      total: questions.filter(q => q.difficulty_level === 'hard').length,
      answered: questions.filter(q => q.difficulty_level === 'hard' && (q.answer_count || 0) > 0).length,
      correct: answers.filter(a => {
        const q = questions.find(q => q.id === a.question_id)
        return q?.difficulty_level === 'hard' && a.correct === true
      }).length,
    },
  }

  const totalAnswers = answers.length
  const correctAnswers = answers.filter(a => a.correct === true).length
  const pendingAnswers = answers.filter(a => a.correct === null).length
  const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

  return (
    <Card className="floating" floating>
      <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4">
        <CardTitle className="text-white">Answer Statistics</CardTitle>
        <CardDescription className="text-white/90">Overview of answers by difficulty level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Answers</p>
            <p className="text-2xl font-bold">{totalAnswers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Correct</p>
            <p className="text-2xl font-bold reward-success">{correctAnswers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-2xl font-bold text-accent">{accuracy.toFixed(1)}%</p>
          </div>
        </div>

        {/* By Difficulty */}
        <div className="space-y-4">
          <h4 className="font-semibold">By Difficulty Level</h4>
          
          {(['easy', 'medium', 'hard'] as const).map(difficulty => {
            const stats = statsByDifficulty[difficulty]
            const answerRate = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0
            
            return (
              <div key={difficulty} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="capitalize">
                    {difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.answered}/{stats.total} answered
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Questions:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Answered:</span>
                    <span className="font-medium">{stats.answered} ({answerRate.toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Correct Answers:</span>
                    <span className="font-medium reward-success">{stats.correct}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Status Breakdown */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Answer Status</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-2xl font-bold reward-success">{correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-2xl font-bold trust-drop">
                {answers.filter(a => a.correct === false).length}
              </p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="text-center p-3 bg-gray-500/20 border border-gray-500/30 rounded-lg">
              <p className="text-2xl font-bold text-muted-foreground">{pendingAnswers}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

