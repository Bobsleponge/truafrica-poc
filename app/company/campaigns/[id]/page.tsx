'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardHeaderGradient } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsensusChart } from '@/components/company/ConsensusChart'
import { AnswerStats } from '@/components/company/AnswerStats'
import { ArrowLeft, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import type { Campaign, Answer } from '@/types/database'

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalResponses: 0,
    completionRate: 0,
    totalCost: 0,
    averageConsensus: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, authLoading, campaignId])

  const loadCampaignData = async () => {
    try {
      // Load campaign
      const response = await fetch(`/api/campaigns?id=${campaignId}`)
      const data = await response.json()

      if (data.success && data.campaigns.length > 0) {
        const campaignData = data.campaigns[0]
        setCampaign(campaignData)

        // Get question IDs
        const questionIds = (campaignData.campaign_questions || []).map(
          (cq: any) => cq.question_id
        )

        // Load answers
        if (questionIds.length > 0) {
          const { data: answersData } = await supabase
            .from('answers')
            .select(`
              *,
              questions:question_id (
                content
              ),
              users:contributor_id (
                name,
                trust_score
              )
            `)
            .in('question_id', questionIds)
            .order('created_at', { ascending: false })

          setAnswers((answersData || []) as Answer[])
        }

        // Calculate stats
        const totalQuestions = campaignData.campaign_questions?.length || 0
        const totalResponses = answers.length
        const requiredResponses = (campaignData.campaign_questions || []).reduce(
          (sum: number, cq: any) => sum + (cq.required_responses || 0),
          0
        )
        const completionRate =
          requiredResponses > 0 ? (totalResponses / requiredResponses) * 100 : 0

        // Get pricing snapshot
        const { data: pricing } = await supabase
          .from('campaign_pricing_snapshots')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const consensusScores = (answers || [])
          .map((a: any) => a.consensus_score)
          .filter((s: number | null) => s !== null) as number[]
        const avgConsensus =
          consensusScores.length > 0
            ? consensusScores.reduce((a, b) => a + b, 0) / consensusScores.length
            : 0

        setStats({
          totalQuestions,
          totalResponses,
          completionRate,
          totalCost: pricing ? Number(pricing.estimated_total_cost) : 0,
          averageConsensus: avgConsensus,
        })
      }
    } catch (err: any) {
      console.error('Error loading campaign:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${campaignId}-${format === 'csv' ? 'data.csv' : 'data.json'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Campaign not found</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      running: { variant: 'default', label: 'Running' },
      completed: { variant: 'secondary', label: 'Completed' },
      archived: { variant: 'outline', label: 'Archived' },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/company/campaigns')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">{campaign.name}</h1>
              <p className="text-muted-foreground mb-2">{campaign.description}</p>
              <div className="flex gap-2 items-center">
                {getStatusBadge(campaign.status)}
                {campaign.needs_question_design && (
                  <Badge variant="outline">Needs Question Design</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalResponses}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.completionRate.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">${stats.totalCost.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Avg Consensus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageConsensus.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Data */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data & API</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <ConsensusChart answers={answers} />
              <AnswerStats
                questions={(campaign as any).campaign_questions?.map((cq: any) => cq.questions) || []}
                answers={answers}
              />
            </div>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Export & API</CardTitle>
                <CardDescription>
                  Download your campaign data or access via API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Export Data</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('json')}>
                      <FileJson className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">API Access</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Access this campaign's data programmatically using your API key.
                  </p>
                  <code className="block p-4 bg-muted rounded text-sm">
                    GET /api/campaigns/{campaignId}/responses
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


