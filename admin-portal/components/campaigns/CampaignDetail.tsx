'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  FolderKanban,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Download,
  BarChart3,
  Users,
  DollarSign,
  FileQuestion,
  MessageSquare,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { InlineEditForm } from '@/components/shared/InlineEditForm'
import { DataTable, Column } from '@/components/shared/DataTable'
import { ExportButton } from '@/components/shared/ExportButton'
import { usePolling } from '@/lib/hooks/usePolling'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import type { Campaign } from '@/types'

interface CampaignDetailProps {
  campaignId: string
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

export default function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'contributors' | 'analytics' | 'pricing'>('overview')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('')

  // Load campaign with polling
  const { data: campaignData, loading: campaignLoading, lastUpdated, refetch } = usePolling<{ campaign: any }>(
    async () => {
      const response = await fetch(`/admin/api/campaigns/get?campaignId=${campaignId}`)
      if (!response.ok) throw new Error('Failed to fetch campaign')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [contributors, setContributors] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [pricing, setPricing] = useState<any>(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  const [loadingContributors, setLoadingContributors] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingPricing, setLoadingPricing] = useState(false)

  const campaign = campaignData?.campaign

  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions()
    } else if (activeTab === 'contributors') {
      loadContributors()
    } else if (activeTab === 'analytics') {
      loadAnalytics()
    } else if (activeTab === 'pricing') {
      loadPricing()
    }
  }, [activeTab, campaignId])

  const loadQuestions = async () => {
    setLoadingQuestions(true)
    try {
      const response = await fetch(`/admin/api/campaigns/${campaignId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const loadAnswers = async (questionId?: string) => {
    setLoadingAnswers(true)
    try {
      const url = questionId
        ? `/admin/api/campaigns/${campaignId}/answers?questionId=${questionId}`
        : `/admin/api/campaigns/${campaignId}/answers`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAnswers(data.answers || [])
      }
    } catch (error) {
      console.error('Error loading answers:', error)
    } finally {
      setLoadingAnswers(false)
    }
  }

  const loadContributors = async () => {
    setLoadingContributors(true)
    try {
      const response = await fetch(`/admin/api/campaigns/${campaignId}/contributors`)
      if (response.ok) {
        const data = await response.json()
        setContributors(data.contributors || [])
      }
    } catch (error) {
      console.error('Error loading contributors:', error)
    } finally {
      setLoadingContributors(false)
    }
  }

  const loadAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const response = await fetch(`/admin/api/campaigns/${campaignId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const loadPricing = async () => {
    setLoadingPricing(true)
    try {
      const response = await fetch(`/admin/api/campaigns/${campaignId}/pricing`)
      if (response.ok) {
        const data = await response.json()
        setPricing(data)
      }
    } catch (error) {
      console.error('Error loading pricing:', error)
    } finally {
      setLoadingPricing(false)
    }
  }

  const handleUpdateField = async (field: string, value: string) => {
    try {
      const response = await fetch('/admin/api/campaigns/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          [field]: value,
        }),
      })

      if (response.ok) {
        refetch()
        setEditingField(null)
      } else {
        alert('Failed to update field')
      }
    } catch (error) {
      console.error('Error updating field:', error)
      alert('Error updating field')
    }
  }

  const handleStatusUpdate = (status: string) => {
    setPendingStatus(status)
    setShowStatusDialog(true)
  }

  const confirmStatusUpdate = async () => {
    try {
      const response = await fetch('/admin/api/campaigns/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          status: pendingStatus,
        }),
      })

      if (response.ok) {
        refetch()
        setShowStatusDialog(false)
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  const handleExport = async (type: 'campaign' | 'answers') => {
    const response = await fetch(`/admin/api/campaigns/${campaignId}/export?format=csv&type=${type}`)
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${campaignId}-${type}-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading campaign details...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button onClick={() => router.push('/campaigns')} className="mt-4">
          Back to Campaigns
        </Button>
      </div>
    )
  }

  const questionColumns: Column<any>[] = [
    { key: 'question.content', label: 'Question', sortable: true },
    { key: 'question_type', label: 'Type', sortable: true },
    { key: 'required_responses', label: 'Required', sortable: true },
    { key: 'answer_count', label: 'Answers', sortable: true },
    { key: 'complexity_level', label: 'Complexity', sortable: true },
  ]

  const contributorColumns: Column<any>[] = [
    { key: 'email', label: 'Email', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'answer_count', label: 'Answers', sortable: true },
    { key: 'average_consensus', label: 'Avg Consensus', sortable: true, render: (v) => v ? Number(v).toFixed(2) : '-' },
    { key: 'accuracy', label: 'Accuracy', sortable: true, render: (v) => v ? `${Number(v).toFixed(1)}%` : '-' },
    { key: 'trust_score', label: 'Trust Score', sortable: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">Campaign details and metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={campaignLoading} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('running')}
              disabled={campaign.status === 'running'}
            >
              <Play className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('paused')}
              disabled={campaign.status === 'paused'}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('completed')}
              disabled={campaign.status === 'completed'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={campaign.status === 'cancelled'}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'questions', label: 'Questions', icon: FileQuestion },
            { id: 'contributors', label: 'Contributors', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'pricing', label: 'Pricing', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>Basic campaign details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Name</div>
                {editingField === 'name' ? (
                  <InlineEditForm
                    value={campaign.name}
                    onSave={(value) => handleUpdateField('name', value)}
                    onCancel={() => setEditingField(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{campaign.name}</div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingField('name')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                {editingField === 'description' ? (
                  <InlineEditForm
                    value={campaign.description || ''}
                    type="textarea"
                    onSave={(value) => handleUpdateField('description', value)}
                    onCancel={() => setEditingField(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{campaign.description || 'No description'}</div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingField('description')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <StatusBadge status={campaign.status} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Client</div>
                <div className="font-medium">
                  {campaign.client?.email || campaign.client_id || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Quick Metrics</CardTitle>
              <CardDescription>Campaign performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.impressions !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Impressions</div>
                  <div className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</div>
                </div>
              )}
              {campaign.responses !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Responses</div>
                  <div className="text-2xl font-bold">{campaign.responses.toLocaleString()}</div>
                </div>
              )}
              {campaign.rewards_distributed !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Rewards Distributed</div>
                  <div className="text-2xl font-bold">{campaign.rewards_distributed.toLocaleString()}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'questions' && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaign Questions</CardTitle>
                <CardDescription>All questions associated with this campaign</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadAnswers()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Answers
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={questions}
              columns={questionColumns}
              loading={loadingQuestions}
              onRowClick={(row) => loadAnswers(row.question_id)}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'contributors' && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Contributors</CardTitle>
            <CardDescription>Contributors who participated in this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={contributors}
              columns={contributorColumns}
              loading={loadingContributors}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Response Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
                <div className="text-2xl font-bold">{analytics.metrics?.total_questions || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Answers</div>
                <div className="text-2xl font-bold">{analytics.metrics?.total_answers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-2xl font-bold">
                  {analytics.metrics?.completion_rate?.toFixed(1) || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Average Consensus</div>
                <div className="text-2xl font-bold">
                  {analytics.metrics?.average_consensus?.toFixed(2) || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Response Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.time_series || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 lg:col-span-2">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.geographic || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="country" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pricing' && pricing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Budget</div>
                <div className="text-2xl font-bold">
                  ${(pricing.pricing?.total_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reward Budget</div>
                <div className="text-xl font-semibold">
                  ${(pricing.pricing?.reward_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Setup Fee</div>
                <div className="text-lg">${(pricing.pricing?.setup_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Per Response Fee</div>
                <div className="text-lg">${(pricing.pricing?.per_response_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Additional Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Validation Fee</div>
                <div className="text-lg">${(pricing.pricing?.validation_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Analytics Fee</div>
                <div className="text-lg">${(pricing.pricing?.analytics_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fine-tuning Fee</div>
                <div className="text-lg">${(pricing.pricing?.fine_tuning_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationDialog
        open={showStatusDialog}
        title="Update Campaign Status"
        description={`Are you sure you want to update this campaign to "${pendingStatus}"?`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmStatusUpdate}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
