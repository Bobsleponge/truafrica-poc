'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  Archive,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Campaign, CampaignStatus } from '@/types/database'

interface CampaignWithStats extends Campaign {
  totalQuestions?: number
  totalResponses?: number
  totalCost?: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadCampaigns()
    }
  }, [user, authLoading, selectedStatus])

  const loadCampaigns = async () => {
    try {
      const statusParam = selectedStatus !== 'all' ? `?status=${selectedStatus}` : ''
      const response = await fetch(`/api/campaigns${statusParam}`)
      const data = await response.json()

      if (data.success) {
        // Calculate stats for each campaign
        const campaignsWithStats = await Promise.all(
          (data.campaigns || []).map(async (campaign: any) => {
            // Fix campaign name: use wizard_data.overview.campaignName if name is "Untitled Campaign" or empty
            let displayName = campaign.name
            if (!displayName || displayName === 'Untitled Campaign') {
              const wizardData = campaign.wizard_data as any
              if (wizardData?.overview?.campaignName) {
                displayName = wizardData.overview.campaignName
              }
            }
            if (!displayName) {
              displayName = 'Untitled Campaign'
            }

            // Use campaign_questions from API response, or count from wizard_data if not finalized
            let questionCount = (campaign.campaign_questions || []).length
            
            // If no questions in campaign_questions, check wizard_data (questions not yet finalized)
            if (questionCount === 0 && campaign.wizard_data?.questions) {
              const wizardQuestions = campaign.wizard_data.questions
              questionCount = Array.isArray(wizardQuestions) ? wizardQuestions.length : 0
            }

            // Get answer count (through questions)
            const questionIds = (campaign.campaign_questions || []).map((cq: any) => cq.question_id).filter(Boolean)
            const { count: answerCount } = questionIds.length > 0
              ? await supabase
                  .from('answers')
                  .select('*', { count: 'exact', head: true })
                  .in('question_id', questionIds)
              : { count: 0 }

            // Get latest pricing snapshot
            const { data: pricing } = await supabase
              .from('campaign_pricing_snapshots')
              .select('*')
              .eq('campaign_id', campaign.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            return {
              ...campaign,
              name: displayName,
              totalQuestions: questionCount,
              totalResponses: answerCount || 0,
              totalCost: pricing ? Number(pricing.estimated_total_cost) : 0,
            }
          })
        )

        setCampaigns(campaignsWithStats)
      }
    } catch (err: any) {
      console.error('Error loading campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      running: { variant: 'default', label: 'Running' },
      completed: { variant: 'secondary', label: 'Completed' },
      archived: { variant: 'outline', label: 'Archived' },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleEdit = (campaign: CampaignWithStats) => {
        router.push(`/client/campaigns/builder/${campaign.id}`)
  }

  const handleDeleteClick = (campaign: CampaignWithStats) => {
    setCampaignToDelete(campaign)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete campaign')
      }

      setSuccess('Campaign deleted successfully')
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
      
      // Refresh campaigns list
      await loadCampaigns()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete campaign')
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading campaigns...</div>
      </div>
    )
  }

  const filteredCampaigns = campaigns.filter(c => 
    selectedStatus === 'all' || c.status === selectedStatus
  )

  const stats = {
    total: campaigns.length,
    running: campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalResponses: campaigns.reduce((sum, c) => sum + (c.totalResponses || 0), 0),
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Campaigns</h1>
            <p className="text-muted-foreground">Manage your data collection campaigns</p>
          </div>
          <Button onClick={() => router.push('/client/campaigns/builder')} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-500">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Running</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.running}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalResponses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>View and manage your campaigns</CardDescription>
              </div>
              <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No campaigns found</p>
                <Button onClick={() => router.push('/client/campaigns/builder')} variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.totalQuestions || 0}</TableCell>
                      <TableCell>{campaign.totalResponses || 0}</TableCell>
                      <TableCell>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/client/campaigns/${campaign.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(campaign)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone and will delete all associated data including questions and responses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCampaignToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


