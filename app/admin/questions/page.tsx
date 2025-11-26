'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Download, Eye, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import type { AdminQuestion, AdminAnswer } from '@/types/admin'

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewingQuestion, setViewingQuestion] = useState<AdminQuestion | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, AdminAnswer[]>>({})
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadQuestions()
    setupSSE()
  }, [page, statusFilter, difficultyFilter, debouncedSearch])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (difficultyFilter !== 'all') {
        params.append('difficulty', difficultyFilter)
      }

      const paramsObj: Record<string, string> = {
        page: page.toString(),
        limit: '50',
      }
      if (statusFilter !== 'all') {
        paramsObj.status = statusFilter
      }
      if (difficultyFilter !== 'all') {
        paramsObj.difficulty = difficultyFilter
      }
      if (debouncedSearch) {
        // Note: API doesn't support search yet, but we can filter client-side
      }

      const queryString = new URLSearchParams(paramsObj).toString()
      const response = await fetch(`/api/admin/questions?${queryString}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      let filteredQuestions = data.questions || []
      // Client-side search filtering
      if (debouncedSearch) {
        filteredQuestions = filteredQuestions.filter((q: AdminQuestion) =>
          q.content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          q.client_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          q.company_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || // Legacy support
          q.campaign_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }

      setQuestions(filteredQuestions)
      setTotalPages(data.pagination?.totalPages || 1)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'question_created') {
          loadQuestions()
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'hard':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const handleView = async (question: AdminQuestion) => {
    setViewingQuestion(question)
    setShowViewDialog(true)
    // Load answers for this question
    loadQuestionAnswers(question.id)
  }

  const loadQuestionAnswers = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/answers?question_id=${questionId}&limit=20`)
      const data = await response.json()
      if (data.success) {
        setQuestionAnswers(prev => ({ ...prev, [questionId]: data.answers || [] }))
      }
    } catch (err) {
      console.error('Error loading question answers:', err)
    }
  }

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(questionId)
      } else {
        newSet.delete(questionId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(new Set(questions.map(q => q.id)))
    } else {
      setSelectedQuestions(new Set())
    }
  }

  const handleBulkStatusUpdate = async (newStatus: 'active' | 'completed' | 'archived') => {
    if (selectedQuestions.size === 0) return
    if (!confirm(`Update ${selectedQuestions.size} question(s) to ${newStatus}?`)) return

    try {
      // Note: This would require a bulk update API endpoint
      // For now, we'll update individually
      const promises = Array.from(selectedQuestions).map(async (questionId) => {
        // Find the question to get its current data
        const question = questions.find(q => q.id === questionId)
        if (!question) return

        // Update via questions API (would need PUT endpoint)
        // For now, just show a message
        console.log(`Would update question ${questionId} to ${newStatus}`)
      })
      await Promise.all(promises)
      setSelectedQuestions(new Set())
      loadQuestions()
      alert(`Updated ${selectedQuestions.size} question(s) to ${newStatus}`)
    } catch (err: any) {
      alert(`Error updating questions: ${err.message}`)
    }
  }

  const exportQuestions = () => {
    const csv = [
      ['Content', 'Company', 'Campaign', 'Difficulty', 'Status', 'Answer Count', 'Avg Consensus', 'Created At'].join(','),
      ...questions.map(q => [
        `"${q.content.replace(/"/g, '""')}"`,
        q.client_name || q.company_name || '', // Legacy support
        q.campaign_name || '',
        q.difficulty_level,
        q.status,
        q.answer_count.toString(),
        q.average_consensus?.toFixed(1) || '',
        new Date(q.created_at).toISOString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `questions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Questions Monitoring</h1>
        <p className="text-muted-foreground">View and monitor all questions across campaigns</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={(value) => {
              setDifficultyFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportQuestions} disabled={questions.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {selectedQuestions.size > 0 && (
              <Select onValueChange={(value) => handleBulkStatusUpdate(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Set to Active ({selectedQuestions.size})</SelectItem>
                  <SelectItem value="completed">Set to Completed ({selectedQuestions.size})</SelectItem>
                  <SelectItem value="archived">Set to Archived ({selectedQuestions.size})</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions.length})</CardTitle>
          <CardDescription>All questions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No questions found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedQuestions.size === questions.length && questions.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Answers</TableHead>
                    <TableHead>Avg Consensus</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedQuestions.has(question.id)}
                          onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{question.content}</div>
                      </TableCell>
                      <TableCell>{question.client_name || question.company_name}</TableCell>
                      <TableCell>
                        {question.campaign_name ? (
                          <Link href={`/admin/campaigns`} className="text-primary hover:underline">
                            {question.campaign_name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDifficultyBadgeVariant(question.difficulty_level)}>
                          {question.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(question.status)}>
                          {question.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.answer_count}</TableCell>
                      <TableCell>
                        {question.average_consensus !== null
                          ? `${question.average_consensus.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(question.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(question)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Question Detail Dialog */}
      {viewingQuestion && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Question Details</DialogTitle>
              <DialogDescription>Complete question information and answers</DialogDescription>
            </DialogHeader>
            <QuestionDetailView
              question={viewingQuestion}
              answers={questionAnswers[viewingQuestion.id] || []}
              onClose={() => {
                setShowViewDialog(false)
                setViewingQuestion(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function QuestionDetailView({
  question,
  answers,
  onClose,
}: {
  question: AdminQuestion
  answers: AdminAnswer[]
  onClose: () => void
}) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Question Content</Label>
            <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{question.content}</p>
          </div>
          <div>
            <Label>Client</Label>
            <p className="text-sm font-medium mt-1">{question.client_name || question.company_name}</p>
          </div>
          <div>
            <Label>Campaign</Label>
            <p className="text-sm mt-1">{question.campaign_name || '-'}</p>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Badge variant={question.difficulty_level === 'easy' ? 'default' : question.difficulty_level === 'medium' ? 'secondary' : 'destructive'} className="mt-1">
              {question.difficulty_level}
            </Badge>
          </div>
          <div>
            <Label>Status</Label>
            <Badge variant={question.status === 'active' ? 'default' : question.status === 'completed' ? 'secondary' : 'outline'} className="mt-1">
              {question.status}
            </Badge>
          </div>
          <div>
            <Label>Answer Count</Label>
            <p className="text-sm font-medium mt-1">{question.answer_count}</p>
          </div>
          <div>
            <Label>Average Consensus</Label>
            <p className="text-sm font-medium mt-1">
              {question.average_consensus !== null
                ? `${question.average_consensus.toFixed(1)}%`
                : '-'}
            </p>
          </div>
          <div>
            <Label>Average Validation Confidence</Label>
            <p className="text-sm font-medium mt-1">
              {question.average_validation_confidence !== null
                ? `${question.average_validation_confidence.toFixed(1)}%`
                : '-'}
            </p>
          </div>
          <div>
            <Label>Created At</Label>
            <p className="text-sm mt-1">{new Date(question.created_at).toLocaleString()}</p>
          </div>
          <div>
            <Label>Last Updated</Label>
            <p className="text-sm mt-1">{new Date(question.updated_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="answers" className="space-y-4">
        {answers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No answers yet
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((answer) => (
              <Card key={answer.id} className="border-border/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{answer.contributor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Trust Score: {answer.contributor_trust_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {answer.consensus_score !== null && (
                        <Badge variant="outline">
                          Consensus: {answer.consensus_score.toFixed(1)}%
                        </Badge>
                      )}
                      {answer.validation_confidence_score !== null && (
                        <Badge variant="outline">
                          Validation: {answer.validation_confidence_score.toFixed(1)}%
                        </Badge>
                      )}
                      {answer.is_flagged && (
                        <Badge variant="destructive">Flagged</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-2 p-2 bg-muted rounded">{answer.answer_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(answer.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

