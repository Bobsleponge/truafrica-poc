/**
 * Trust score calculation and management
 */

export interface TrustScoreConfig {
  initialScore: number
  correctAnswerBonus: number
  incorrectAnswerPenalty: number
  consensusBonus: number
  minScore: number
  maxScore: number
}

export const DEFAULT_TRUST_SCORE_CONFIG: TrustScoreConfig = {
  initialScore: 50,
  correctAnswerBonus: 2,
  incorrectAnswerPenalty: 5,
  consensusBonus: 1, // Bonus for high consensus (>90%)
  minScore: 0,
  maxScore: 100,
}

/**
 * Calculate initial trust score based on onboarding test performance
 */
export function calculateInitialTrustScore(
  correctAnswers: number,
  totalQuestions: number,
  difficultyWeights: { easy: number; medium: number; hard: number } = {
    easy: 1,
    medium: 2,
    hard: 3,
  }
): number {
  if (totalQuestions === 0) return DEFAULT_TRUST_SCORE_CONFIG.initialScore
  
  const percentage = (correctAnswers / totalQuestions) * 100
  
  // Base score from percentage
  let score = (percentage / 100) * 60 // Max 60 from percentage
  
  // Bonus for perfect scores
  if (percentage === 100) {
    score = 80
  } else if (percentage >= 80) {
    score = 70
  } else if (percentage >= 60) {
    score = 60
  } else if (percentage >= 40) {
    score = 50
  } else {
    score = 40
  }
  
  return Math.max(
    DEFAULT_TRUST_SCORE_CONFIG.minScore,
    Math.min(DEFAULT_TRUST_SCORE_CONFIG.maxScore, score)
  )
}

/**
 * Calculate new trust score after answering a question
 */
export function calculateNewTrustScore(
  currentScore: number,
  isCorrect: boolean,
  consensusScore: number,
  config: TrustScoreConfig = DEFAULT_TRUST_SCORE_CONFIG
): number {
  let newScore = currentScore
  
  if (isCorrect) {
    newScore += config.correctAnswerBonus
    
    // Bonus for high consensus
    if (consensusScore >= 90) {
      newScore += config.consensusBonus
    }
  } else {
    newScore -= config.incorrectAnswerPenalty
  }
  
  return Math.max(
    config.minScore,
    Math.min(config.maxScore, newScore)
  )
}

/**
 * Determine which difficulty levels a contributor can access
 */
export function getAccessibleDifficultyLevels(trustScore: number): string[] {
  if (trustScore >= 80) {
    return ['easy', 'medium', 'hard']
  } else if (trustScore >= 60) {
    return ['easy', 'medium']
  } else {
    return ['easy']
  }
}

/**
 * Get trust score tier/level
 */
export function getTrustScoreTier(trustScore: number): {
  tier: string
  color: string
  label: string
} {
  if (trustScore >= 80) {
    return { tier: 'expert', color: 'green', label: 'Expert Contributor' }
  } else if (trustScore >= 60) {
    return { tier: 'advanced', color: 'blue', label: 'Advanced Contributor' }
  } else if (trustScore >= 40) {
    return { tier: 'intermediate', color: 'yellow', label: 'Intermediate Contributor' }
  } else {
    return { tier: 'beginner', color: 'gray', label: 'Beginner Contributor' }
  }
}

