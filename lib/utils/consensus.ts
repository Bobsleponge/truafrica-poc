/**
 * Consensus calculation utility
 * Compares an answer against the majority of other contributors' answers
 */

export interface AnswerComparison {
  answerId: string
  answerText: string
  similarity: number
}

/**
 * Calculate similarity between two text answers using simple word overlap
 * In production, consider using more sophisticated NLP techniques
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0
}

/**
 * Calculate consensus score for an answer
 * Compares against all other answers for the same question
 */
export function calculateConsensusScore(
  answerText: string,
  otherAnswers: string[]
): number {
  if (otherAnswers.length === 0) return 100 // First answer gets full score
  
  const similarities = otherAnswers.map(other =>
    calculateTextSimilarity(answerText, other)
  )
  
  // Average similarity with all other answers
  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
  
  // Consensus threshold: answers with >70% similarity are considered in consensus
  return avgSimilarity
}

/**
 * Determine if an answer is correct based on consensus
 * An answer is correct if its consensus score is >= 70%
 */
export function isAnswerCorrect(consensusScore: number): boolean {
  return consensusScore >= 70
}

/**
 * Get majority answer text from a set of answers
 */
export function getMajorityAnswer(answers: string[]): string {
  if (answers.length === 0) return ''
  if (answers.length === 1) return answers[0]
  
  // Group similar answers
  const groups: { text: string; count: number; answers: string[] }[] = []
  
  for (const answer of answers) {
    let found = false
    for (const group of groups) {
      if (calculateTextSimilarity(answer, group.text) >= 70) {
        group.count++
        group.answers.push(answer)
        found = true
        break
      }
    }
    if (!found) {
      groups.push({ text: answer, count: 1, answers: [answer] })
    }
  }
  
  // Return the most common group's representative answer
  const majority = groups.reduce((a, b) => (a.count > b.count ? a : b))
  return majority.text
}

