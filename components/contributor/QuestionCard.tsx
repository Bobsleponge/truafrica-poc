'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeaderGradient, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertCircle, Zap, Award } from 'lucide-react'
import type { Question, DifficultyLevel } from '@/types/database'

interface QuestionCardProps {
  question: Question & { field_name?: string }
  onAnswer: (questionId: string) => void
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const difficultyConfig: Record<DifficultyLevel, { 
    color: string
    icon: React.ReactNode
    bg: string
    className: string
    points: string
  }> = {
    easy: {
      color: 'text-green-500',
      bg: 'bg-green-500/20 border-green-500/30',
      className: 'difficulty-easy',
      icon: <TrendingUp className="h-4 w-4" />,
      points: '+10 pts'
    },
    medium: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      className: 'difficulty-medium',
      icon: <AlertCircle className="h-4 w-4" />,
      points: '+15 pts'
    },
    hard: {
      color: 'text-red-500',
      bg: 'bg-red-500/20 border-red-500/30',
      className: 'difficulty-hard',
      icon: <Sparkles className="h-4 w-4" />,
      points: '+25 pts'
    },
  }

  const config = difficultyConfig[question.difficulty_level]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="floating gradient overflow-hidden hover-lift" gradient floating>
        <CardHeaderGradient>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-white" />
                {question.field_name && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {question.field_name}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg text-white line-clamp-2">{question.content}</CardTitle>
            </div>
          </div>
        </CardHeaderGradient>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={`${config.bg} ${config.color} ${config.className} border flex items-center gap-1`}>
              {config.icon}
              <span className="capitalize font-medium">{question.difficulty_level}</span>
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Award className="h-4 w-4 reward-success" />
              <span className="reward-success font-mono">{config.points}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Trust Impact</p>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                {question.difficulty_level === 'easy' ? '+2' : question.difficulty_level === 'medium' ? '+3' : '+5'} trust score
              </span>
            </div>
          </div>

          <Button 
            onClick={() => onAnswer(question.id)} 
            className="w-full glow-hover" 
            variant="gradient"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Answer This Question
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

