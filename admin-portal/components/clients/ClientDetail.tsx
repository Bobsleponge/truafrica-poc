'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Edit,
  CheckCircle,
  XCircle,
  FolderKanban,
  DollarSign,
  Users,
  BarChart3,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { InlineEditForm } from '@/components/shared/InlineEditForm'
import { DataTable, Column } from '@/components/shared/DataTable'
import { ExportButton } from '@/components/shared/ExportButton'
import { usePolling } from '@/lib/hooks/usePolling'
import type { Client, Campaign } from '@/types'

interface ClientDetailProps {
  clientId: string
}

export default function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'statistics'>('overview')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [loadingStatistics, setLoadingStatistics] = useState(false)

  // Load client with polling
  const { data: clientData, loading: clientLoading, lastUpdated, refetch } = usePolling<{ client: Client }>(
    async () => {
      const response = await fetch(`/admin/api/clients/get?clientId=${clientId}`)
      if (!response.ok) throw new Error('Failed to fetch client')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const client = clientData?.client

  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns()
    } else if (activeTab === 'statistics') {
      loadStatistics()
    }
  }, [activeTab, clientId])

  const loadCampaigns = async () => {
    setLoadingCampaigns(true)
    try {
      const response = await fetch(`/admin/api/clients/${clientId}/campaigns`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const loadStatistics = async () => {
    setLoadingStatistics(true)
    try {
      const response = await fetch(`/admin/api/clients/${clientId}/statistics`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoadingStatistics(false)
    }
  }

  const handleUpdateField = async (field: string, value: string) => {
    try {
      const response = await fetch('/admin/api/clients/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
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
      const response = await fetch('/admin/api/clients/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
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

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading client details...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Client not found</p>
        <Button onClick={() => router.push('/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    )
  }

  const campaignColumns: Column<Campaign>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v as string} /> },
    { key: 'total_budget', label: 'Budget', sortable: true, render: (v) => v ? `$${Number(v).toLocaleString()}` : '-' },
    { key: 'created_at', label: 'Created', sortable: true, render: (v) => new Date(v as string).toLocaleDateString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">Client details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={clientLoading} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('active')}
              disabled={client.status === 'active'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('suspended')}
              disabled={client.status === 'suspended'}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'campaigns', label: 'Campaigns', icon: FolderKanban },
            { id: 'statistics', label: 'Statistics', icon: BarChart3 },
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
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Basic client details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Name</div>
                {editingField === 'name' ? (
                  <InlineEditForm
                    value={client.name}
                    onSave={(value) => handleUpdateField('name', value)}
                    onCancel={() => setEditingField(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{client.name}</div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingField('name')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{client.contact_email}</div>
                </div>
              </div>
              {client.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-cyan-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{client.contact_phone}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <StatusBadge status={client.status} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(client.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Client activity overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Campaigns</div>
                <div className="text-2xl font-bold">{campaigns.length}</div>
              </div>
              {statistics && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Campaigns</div>
                    <div className="text-xl font-semibold">{statistics.active_campaigns}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Spend</div>
                    <div className="text-xl font-semibold">
                      ${statistics.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Campaigns</CardTitle>
                <CardDescription>All campaigns for this client</CardDescription>
              </div>
              <ExportButton
                data={campaigns.map((c) => ({
                  Name: c.name,
                  Status: c.status,
                  Budget: c.total_budget || 0,
                  'Created At': new Date(c.created_at).toLocaleString(),
                }))}
                filename={`client-${clientId}-campaigns`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={campaigns}
              columns={campaignColumns}
              loading={loadingCampaigns}
              onRowClick={(row) => router.push(`/campaigns/${row.id}`)}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'statistics' && statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Campaign Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Campaigns</div>
                <div className="text-2xl font-bold">{statistics.total_campaigns}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Campaigns</div>
                <div className="text-2xl font-bold">{statistics.active_campaigns}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Financial Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Spend</div>
                <div className="text-2xl font-bold">
                  ${statistics.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reward Budget</div>
                <div className="text-xl font-semibold">
                  ${statistics.total_reward_budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Engagement Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Responses</div>
                <div className="text-2xl font-bold">{statistics.total_responses}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Contributor Engagement</div>
                <div className="text-2xl font-bold">{statistics.contributor_engagement}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationDialog
        open={showStatusDialog}
        title="Update Client Status"
        description={`Are you sure you want to update this client to "${pendingStatus}"?`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmStatusUpdate}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
