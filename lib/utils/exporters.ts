/**
 * Data export utilities
 * Convert campaign data to CSV and JSON formats
 */

export interface ExportAnswer {
  id: string
  questionId: string
  questionContent: string
  answerText: string
  contributorId: string
  contributorName: string | null
  contributorTrustScore: number | null
  consensusScore: number | null
  validationConfidenceScore: number | null
  correct: boolean | null
  createdAt: string
}

/**
 * Convert answers to CSV format
 */
export function exportToCSV(answers: ExportAnswer[]): string {
  if (answers.length === 0) {
    return 'No data to export'
  }

  // CSV headers
  const headers = [
    'Answer ID',
    'Question ID',
    'Question Content',
    'Answer Text',
    'Contributor ID',
    'Contributor Name',
    'Contributor Trust Score',
    'Consensus Score',
    'Validation Confidence Score',
    'Correct',
    'Created At',
  ]

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const str = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build CSV rows
  const rows = [
    headers.join(','),
    ...answers.map((answer) =>
      [
        escapeCSV(answer.id),
        escapeCSV(answer.questionId),
        escapeCSV(answer.questionContent),
        escapeCSV(answer.answerText),
        escapeCSV(answer.contributorId),
        escapeCSV(answer.contributorName),
        escapeCSV(answer.contributorTrustScore),
        escapeCSV(answer.consensusScore),
        escapeCSV(answer.validationConfidenceScore),
        escapeCSV(answer.correct),
        escapeCSV(answer.createdAt),
      ].join(',')
    ),
  ]

  return rows.join('\n')
}

/**
 * Convert answers to JSON format
 */
export function exportToJSON(answers: ExportAnswer[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalAnswers: answers.length,
      answers: answers.map((answer) => ({
        id: answer.id,
        question: {
          id: answer.questionId,
          content: answer.questionContent,
        },
        answer: {
          text: answer.answerText,
          consensusScore: answer.consensusScore,
          validationConfidenceScore: answer.validationConfidenceScore,
          correct: answer.correct,
        },
        contributor: {
          id: answer.contributorId,
          name: answer.contributorName,
          trustScore: answer.contributorTrustScore,
        },
        metadata: {
          createdAt: answer.createdAt,
        },
      })),
    },
    null,
    2
  )
}

/**
 * Format export data from database format
 */
export function formatExportData(data: any[]): ExportAnswer[] {
  return data.map((item) => ({
    id: item.id,
    questionId: item.question_id,
    questionContent: item.questions?.content || '',
    answerText: item.answer_text,
    contributorId: item.contributor_id,
    contributorName: item.users?.name || null,
    contributorTrustScore: item.users?.trust_score || null,
    consensusScore: item.consensus_score,
    validationConfidenceScore: item.validation_confidence_score,
    correct: item.correct,
    createdAt: item.created_at,
  }))
}




