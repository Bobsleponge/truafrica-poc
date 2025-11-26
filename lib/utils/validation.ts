/**
 * Multi-layer validation orchestrator
 * Combines majority voting, text similarity, ML confidence, and human validation
 */

import { calculateConsensusScore, isAnswerCorrect } from './consensus'
import {
  calculateMajorityVoteRating,
  calculateMajorityVoteMultipleChoice,
  isAnswerInMajority,
  getMajorityConfidenceThreshold,
} from './majorityVoting'
import { calculateMLConfidence } from './mlConfidence'
import type { ValidationType, QuestionType } from '@/types/database'

export interface ValidationResult {
  isValid: boolean
  confidenceScore: number // Aggregated confidence 0-100
  validationDetails: {
    majorityVoting?: {
      confidence: number
      majorityValue: string | number
    }
    textSimilarity?: {
      consensusScore: number
    }
    mlConfidence?: {
      confidence: number
      model: string
    }
  }
  shouldFlag: boolean // Whether to flag for human review
  flagReason?: string
}

export interface ValidationContext {
  answerId: string
  answerText: string
  questionId: string
  questionText: string
  questionType: QuestionType
  otherAnswers: string[] // Other answers for the same question
  contributorTrustScore?: number
}

/**
 * Main validation function that orchestrates all validation layers
 */
export async function validateAnswer(context: ValidationContext): Promise<ValidationResult> {
  const { answerText, questionType, otherAnswers, questionText } = context
  const validationDetails: ValidationResult['validationDetails'] = {}
  let shouldFlag = false
  let flagReason: string | undefined

  // 1. Majority Voting (for rating and multiple-choice questions)
  if (questionType === 'rating' || questionType === 'multiple_choice') {
    try {
      let majorityResult
      if (questionType === 'rating') {
        const numericAnswers = otherAnswers.map(a => {
          const num = Number(a)
          return isNaN(num) ? 0 : num
        })
        majorityResult = calculateMajorityVoteRating(numericAnswers)
      } else {
        majorityResult = calculateMajorityVoteMultipleChoice(otherAnswers)
      }

      validationDetails.majorityVoting = {
        confidence: majorityResult.confidence,
        majorityValue: majorityResult.majorityValue,
      }

      // Check if answer is in majority
      const inMajority = isAnswerInMajority(
        answerText,
        majorityResult.majorityValue,
        questionType === 'rating' ? 'rating' : 'multiple_choice'
      )

      if (!inMajority || majorityResult.confidence < getMajorityConfidenceThreshold()) {
        shouldFlag = true
        flagReason = `Answer does not match majority vote (${majorityResult.confidence.toFixed(1)}% confidence)`
      }
    } catch (error) {
      console.error('Error in majority voting validation:', error)
    }
  }

  // 2. Text Similarity / Consensus (for open_text questions, or as additional check)
  if (questionType === 'open_text' || otherAnswers.length > 0) {
    try {
      const consensusScore = calculateConsensusScore(answerText, otherAnswers)
      validationDetails.textSimilarity = {
        consensusScore,
      }

      // Flag if consensus is low
      if (consensusScore < 50) {
        shouldFlag = true
        flagReason = `Low text similarity consensus (${consensusScore.toFixed(1)}%)`
      }
    } catch (error) {
      console.error('Error in text similarity validation:', error)
    }
  }

  // 3. ML Confidence (for all question types)
  try {
    const mlResult = await calculateMLConfidence(answerText, questionText, questionType)
    validationDetails.mlConfidence = {
      confidence: mlResult.confidence,
      model: mlResult.model,
    }

    // Flag if ML confidence is low
    if (mlResult.confidence < 60) {
      shouldFlag = true
      flagReason = `Low ML confidence (${mlResult.confidence.toFixed(1)}%)`
    }
  } catch (error) {
    console.error('Error in ML confidence validation:', error)
    // Don't fail validation if ML service is unavailable
  }

  // Calculate aggregated confidence score (weighted average)
  const confidenceScore = calculateAggregatedConfidence(validationDetails, questionType)

  // Determine if answer is valid
  const isValid = determineValidity(confidenceScore, validationDetails, questionType)

  // Additional flagging conditions
  if (context.contributorTrustScore !== undefined && context.contributorTrustScore < 40) {
    shouldFlag = true
    flagReason = `Low contributor trust score (${context.contributorTrustScore})`
  }

  return {
    isValid,
    confidenceScore,
    validationDetails,
    shouldFlag,
    flagReason,
  }
}

/**
 * Calculate aggregated confidence score from all validation layers
 */
function calculateAggregatedConfidence(
  details: ValidationResult['validationDetails'],
  questionType: QuestionType
): number {
  const scores: number[] = []
  const weights: number[] = []

  // Weight different validators based on question type
  if (questionType === 'rating' || questionType === 'multiple_choice') {
    // Majority voting is most important for closed questions
    if (details.majorityVoting) {
      scores.push(details.majorityVoting.confidence)
      weights.push(0.6)
    }
    if (details.mlConfidence) {
      scores.push(details.mlConfidence.confidence)
      weights.push(0.4)
    }
  } else if (questionType === 'open_text') {
    // Text similarity and ML confidence are important for open text
    if (details.textSimilarity) {
      scores.push(details.textSimilarity.consensusScore)
      weights.push(0.5)
    }
    if (details.mlConfidence) {
      scores.push(details.mlConfidence.confidence)
      weights.push(0.5)
    }
  } else {
    // Audio or other types - rely on ML confidence
    if (details.mlConfidence) {
      scores.push(details.mlConfidence.confidence)
      weights.push(1.0)
    }
  }

  if (scores.length === 0) {
    return 50 // Default confidence if no validators ran
  }

  // Calculate weighted average
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0)
  return totalWeight > 0 ? weightedSum / totalWeight : 50
}

/**
 * Determine if answer is valid based on confidence and validation details
 */
function determineValidity(
  confidenceScore: number,
  details: ValidationResult['validationDetails'],
  questionType: QuestionType
): boolean {
  // Base threshold
  const threshold = 60

  // Adjust threshold based on question type
  if (questionType === 'rating' || questionType === 'multiple_choice') {
    // For closed questions, majority voting is definitive
    if (details.majorityVoting) {
      return (
        details.majorityVoting.confidence >= getMajorityConfidenceThreshold() &&
        confidenceScore >= threshold
      )
    }
  }

  // For open text, use consensus threshold
  if (questionType === 'open_text' && details.textSimilarity) {
    return details.textSimilarity.consensusScore >= 70 && confidenceScore >= threshold
  }

  // Fallback to overall confidence score
  return confidenceScore >= threshold
}

/**
 * Check if answer should be flagged for human review
 */
export function shouldFlagForHumanReview(
  validationResult: ValidationResult,
  minConfidenceThreshold: number = 50
): boolean {
  return (
    validationResult.shouldFlag ||
    validationResult.confidenceScore < minConfidenceThreshold ||
    (validationResult.validationDetails.majorityVoting?.confidence !== undefined &&
      validationResult.validationDetails.majorityVoting.confidence < 40) ||
    (validationResult.validationDetails.textSimilarity?.consensusScore !== undefined &&
      validationResult.validationDetails.textSimilarity.consensusScore < 40)
  )
}




