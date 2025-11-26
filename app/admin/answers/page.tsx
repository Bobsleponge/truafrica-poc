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
import { Search, Download, Eye, CheckCircle2, XCircle, GitCompare } from 'lucide-react'
import type { AdminAnswer } from '@/types/admin'

export default function AdminAnswersPage() {
  const [answers, setAnswers] = useState<AdminAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flaggedFilter, setFlaggedFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewingAnswer, setViewingAnswer] = useState<AdminAnswer | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set())
  const [comparingAnswers, setComparingAnswers] = useState<AdminAnswer[]>([])
  const [showCompareDialog, setShowCompareDialog] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadAnswers()
    setupSSE()
  }, [page, flaggedFilter, statusFilter, debouncedSearch])

  const loadAnswers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (flaggedFilter !== 'all') {
        params.append('flagged', flaggedFilter)
      }

      const response = await fetch(`/api/admin/answers?${params}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      let filteredAnswers = data.answers || []
      
      // Client-side filtering
      if (statusFilter !== 'all') {
        filteredAnswers = filteredAnswers.filter((a: AdminAnswer) => {
          if (statusFilter === 'valid') return a.correct === true
          if (statusFilter === 'invalid') return a.correct === false
          if (statusFilter === 'pending') return a.correct === null
          return true
        })
      }
      
      if (debouncedSearch) {
        filteredAnswers = filteredAnswers.filter((a: AdminAnswer) =>
          a.answer_text.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          a.question_content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          a.contributor_name.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }

      setAnswers(filteredAnswers)
      setTotalPages(data.pagination?.totalPages || 1)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading answers:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'answer_submitted' || data.type === 'flagged_answer') {
          loadAnswers()
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

  const handleView = (answer: AdminAnswer) => {
    setViewingAnswer(answer)
    setShowViewDialog(true)
  }

  const handleSelectAnswer = (answerId: string, checked: boolean) => {
    setSelectedAnswers(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(answerId)
      } else {
        newSet.delete(answerId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnswers(new Set(answers.map(a => a.id)))
    } else {
      setSelectedAnswers(new Set())
    }
  }

  const handleBulkValidate = async (correct: boolean) => {
    if (selectedAnswers.size === 0) return
    if (!confirm(`Mark ${selectedAnswers.size} answer(s) as ${correct ? 'valid' : 'invalid'}?`)) return

    try {
      // Note: This would require a bulk validation API endpoint
      // For now, we'll validate individually via the validation API
      const promises = Array.from(selectedAnswers).map(async (answerId) => {
        const answer = answers.find(a => a.id === answerId)
        if (!answer) return

        const response = await fetch('/api/validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answerId, correct }),
        })
        return response.json()
      })
      
      await Promise.all(promises)
      setSelectedAnswers(new Set())
      loadAnswers()
      alert(`Validated ${selectedAnswers.size} answer(s)`)
    } catch (err: any) {
      alert(`Error validating answers: ${err.message}`)
    }
  }

  const handleCompare = () => {
    if (selectedAnswers.size < 2) {
      alert('Please select at least 2 answers to compare')
      return
    }
    const selected = answers.filter(a => selectedAnswers.has(a.id))
    setComparingAnswers(selected)
    setShowCompareDialog(true)
  }

  const exportAnswers = () => {
    const csv = [
      ['Question', 'Answer', 'Contributor', 'Trust Score', 'Consensus', 'Validation', 'Status', 'Created At'].join(','),
      ...answers.map(a => [
        `"${a.question_content.replace(/"/g, '""')}"`,
        `"${a.answer_text.replace(/"/g, '""')}"`,
        a.contributor_name,
        a.contributor_trust_score.toFixed(1),
        a.consensus_score?.toFixed(1) || '',
        a.validation_confidence_score?.toFixed(1) || '',
        a.is_flagged ? 'Flagged' : a.correct === true ? 'Valid' : a.correct === false ? 'Invalid' : 'Pending',
        new Date(a.created_at).toISOString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `answers-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Answers Monitoring</h1>
        <p className="text-muted-foreground">View all answers with validation scores</p>
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
                  placeholder="Search answers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={flaggedFilter} onValueChange={(value) => {
              setFlaggedFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Flagged Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Answers</SelectItem>
                <SelectItem value="true">Flagged Only</SelectItem>
                <SelectItem value="false">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Validation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportAnswers} disabled={answers.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {selectedAnswers.size >= 2 && (
              <Button variant="outline" onClick={handleCompare}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare ({selectedAnswers.size})
              </Button>
            )}
            {selectedAnswers.size > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkValidate(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Valid ({selectedAnswers.size})
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkValidate(false)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Invalid ({selectedAnswers.size})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Answers ({answers.length})</CardTitle>
          <CardDescription>All answers with validation metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : answers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No answers found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAnswers.size === answers.length && answers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Consensus</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {answers.map((answer) => (
                    <TableRow key={answer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAnswers.has(answer.id)}
                          onCheckedChange={(checked) => handleSelectAnswer(answer.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{answer.question_content}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{answer.answer_text}</div>
                      </TableCell>
                      <TableCell>{answer.contributor_name}</TableCell>
                      <TableCell>{answer.contributor_trust_score.toFixed(1)}</TableCell>
                      <TableCell>
                        {answer.consensus_score !== null
                          ? `${answer.consensus_score.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {answer.validation_confidence_score !== null
                          ? `${answer.validation_confidence_score.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {answer.is_flagged ? (
                          <Badge variant="destructive">
                            Flagged: {answer.flagged_reason || 'Unknown'}
                          </Badge>
                        ) : answer.correct === true ? (
                          <Badge variant="default">Valid</Badge>
                        ) : answer.correct === false ? (
                          <Badge variant="secondary">Invalid</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(answer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(answer)}
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

      {/* Answer Detail Dialog */}
      {viewingAnswer && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Answer Details</DialogTitle>
              <DialogDescription>Complete answer information and context</DialogDescription>
            </DialogHeader>
            <AnswerDetailView
              answer={viewingAnswer}
              onClose={() => {
                setShowViewDialog(false)
                setViewingAnswer(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Compare Answers Dialog */}
      {comparingAnswers.length > 0 && (
        <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare Answers</DialogTitle>
              <DialogDescription>Compare {comparingAnswers.length} answers side by side</DialogDescription>
            </DialogHeader>
            <AnswerComparisonView
              answers={comparingAnswers}
              onClose={() => {
                setShowCompareDialog(false)
                setComparingAnswers([])
                setSelectedAnswers(new Set())
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AnswerDetailView({
  answer,
  onClose,
}: {
  answer: AdminAnswer
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Question</Label>
        <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{answer.question_content}</p>
      </div>
      <div>
        <Label>Answer</Label>
        <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{answer.answer_text}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contributor</Label>
          <p className="text-sm font-medium mt-1">{answer.contributor_name}</p>
        </div>
        <div>
          <Label>Trust Score</Label>
          <p className="text-sm font-medium mt-1">{answer.contributor_trust_score.toFixed(1)}</p>
        </div>
        <div>
          <Label>Consensus Score</Label>
          <p className="text-sm mt-1">
            {answer.consensus_score !== null ? `${answer.consensus_score.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div>
          <Label>Validation Confidence</Label>
          <p className="text-sm mt-1">
            {answer.validation_confidence_score !== null ? `${answer.validation_confidence_score.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div>
          <Label>Status</Label>
          <div className="mt-1">
            {answer.is_flagged ? (
              <Badge variant="destructive">
                Flagged: {answer.flagged_reason || 'Unknown'}
              </Badge>
            ) : answer.correct === true ? (
              <Badge variant="default">Valid</Badge>
            ) : answer.correct === false ? (
              <Badge variant="secondary">Invalid</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </div>
        <div>
          <Label>Created At</Label>
          <p className="text-sm mt-1">{new Date(answer.created_at).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function AnswerComparisonView({
  answers,
  onClose,
}: {
  answers: AdminAnswer[]
  onClose: () => void
}) {
  if (answers.length === 0) return null

  const questionContent = answers[0]?.question_content || ''

  return (
    <div className="space-y-4">
      <div>
        <Label>Question</Label>
        <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{questionContent}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {answers.map((answer, index) => (
          <Card key={answer.id} className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Answer {index + 1}</CardTitle>
              <CardDescription>{answer.contributor_name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Answer Text</Label>
                <p className="text-sm mt-1 p-2 bg-muted rounded">{answer.answer_text}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Trust Score:</span>
                  <span className="ml-1 font-medium">{answer.contributor_trust_score.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consensus:</span>
                  <span className="ml-1 font-medium">
                    {answer.consensus_score !== null ? `${answer.consensus_score.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Validation:</span>
                  <span className="ml-1 font-medium">
                    {answer.validation_confidence_score !== null ? `${answer.validation_confidence_score.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={answer.is_flagged ? 'destructive' : answer.correct === true ? 'default' : answer.correct === false ? 'secondary' : 'outline'} className="ml-1 text-xs">
                    {answer.is_flagged ? 'Flagged' : answer.correct === true ? 'Valid' : answer.correct === false ? 'Invalid' : 'Pending'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(answer.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

