/**
 * Majority voting validation for closed questions (rating, multiple-choice)
 * Determines the correct answer based on majority vote
 */

export interface VoteResult {
  majorityValue: string | number
  voteCount: number
  totalVotes: number
  confidence: number // Percentage of votes for majority
}

/**
 * Calculate majority vote for rating questions (numeric answers)
 */
export function calculateMajorityVoteRating(answers: number[]): VoteResult {
  if (answers.length === 0) {
    return {
      majorityValue: 0,
      voteCount: 0,
      totalVotes: 0,
      confidence: 0,
    }
  }

  // Count occurrences of each rating
  const voteCounts: Record<number, number> = {}
  for (const answer of answers) {
    voteCounts[answer] = (voteCounts[answer] || 0) + 1
  }

  // Find the rating with most votes
  let majorityValue = 0
  let maxVotes = 0
  for (const [value, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count
      majorityValue = Number(value)
    }
  }

  const confidence = (maxVotes / answers.length) * 100

  return {
    majorityValue,
    voteCount: maxVotes,
    totalVotes: answers.length,
    confidence,
  }
}

/**
 * Calculate majority vote for multiple-choice questions (string answers)
 */
export function calculateMajorityVoteMultipleChoice(answers: string[]): VoteResult {
  if (answers.length === 0) {
    return {
      majorityValue: '',
      voteCount: 0,
      totalVotes: 0,
      confidence: 0,
    }
  }

  // Normalize answers (trim, lowercase for comparison)
  const normalizedAnswers = answers.map(a => a.trim().toLowerCase())

  // Count occurrences of each answer
  const voteCounts: Record<string, number> = {}
  for (const answer of normalizedAnswers) {
    voteCounts[answer] = (voteCounts[answer] || 0) + 1
  }

  // Find the answer with most votes
  let majorityValue = ''
  let maxVotes = 0
  for (const [value, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count
      majorityValue = value
    }
  }

  const confidence = (maxVotes / answers.length) * 100

  // Return original case version if possible
  const originalAnswer = answers.find(a => a.trim().toLowerCase() === majorityValue)
  return {
    majorityValue: originalAnswer || majorityValue,
    voteCount: maxVotes,
    totalVotes: answers.length,
    confidence,
  }
}

/**
 * Determine if an answer matches the majority vote
 */
export function isAnswerInMajority(
  answer: string | number,
  majorityValue: string | number,
  questionType: 'rating' | 'multiple_choice'
): boolean {
  if (questionType === 'rating') {
    return Number(answer) === Number(majorityValue)
  } else {
    return String(answer).trim().toLowerCase() === String(majorityValue).trim().toLowerCase()
  }
}

/**
 * Get confidence threshold for majority voting
 * Answers with confidence >= threshold are considered valid
 */
export function getMajorityConfidenceThreshold(): number {
  return 50 // At least 50% of votes must agree
}




