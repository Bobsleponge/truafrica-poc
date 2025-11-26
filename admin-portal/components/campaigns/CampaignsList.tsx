'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FolderKanban, Plus, Trash2, Play, Pause, CheckCircle, XCircle } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { ExportButton } from '@/components/shared/ExportButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { usePolling } from '@/lib/hooks/usePolling'
import type { Campaign, Client } from '@/types'

interface CampaignWithClient extends Campaign {
  client?: {
    id: string
    email: string
    name?: string
  }
}

export default function CampaignsList() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: '',
    clientId: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    startDate: '',
    endDate: '',
    campaignMode: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('')

  // Load clients for filter
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/admin/api/clients/list?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    loadClients()
  }, [])

  // Load campaigns with polling
  const { data, loading, lastUpdated, refetch } = usePolling<{
    campaigns: CampaignWithClient[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>(
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      if (filters.status) params.append('status', filters.status)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.search) params.append('search', filters.search)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.campaignMode) params.append('campaignMode', filters.campaignMode)

      const response = await fetch(`/admin/api/campaigns/list?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  useEffect(() => {
    if (data) {
      setCampaigns(data.campaigns || [])
    }
  }, [data])

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.size === 0) return

    setPendingStatus(status)
    setShowStatusDialog(true)
  }

  const confirmBulkStatusUpdate = async () => {
    try {
      const response = await fetch('/admin/api/campaigns/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignIds: Array.from(selectedRows),
          status: pendingStatus,
        }),
      })

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowStatusDialog(false)
      } else {
        alert('Failed to update campaigns')
      }
    } catch (error) {
      console.error('Error updating campaigns:', error)
      alert('Error updating campaigns')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    setShowDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch(
        `/admin/api/campaigns/bulk-delete?ids=${Array.from(selectedRows).join(',')}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowDeleteDialog(false)
      } else {
        alert('Failed to delete campaigns')
      }
    } catch (error) {
      console.error('Error deleting campaigns:', error)
      alert('Error deleting campaigns')
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    const params = new URLSearchParams({ format })
    if (filters.status) params.append('status', filters.status)
    if (filters.clientId) params.append('clientId', filters.clientId)

    const response = await fetch(`/admin/api/campaigns/export?${params}`)
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaigns-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const columns: Column<CampaignWithClient>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <FolderKanban className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            {row.description && (
              <div className="text-xs text-muted-foreground truncate max-w-md">
                {row.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      sortable: false,
      render: (value) => {
        const client = value as CampaignWithClient['client']
        return client ? (
          <div>
            <div className="font-medium">{client.name || client.email}</div>
            <div className="text-xs text-muted-foreground">{client.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'total_budget',
      label: 'Budget',
      sortable: true,
      render: (value) =>
        value ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ]

  const exportData = campaigns.map((campaign) => ({
    Name: campaign.name,
    Description: campaign.description || '',
    Status: campaign.status,
    Client: campaign.client?.name || campaign.client?.email || '',
    Budget: campaign.total_budget || 0,
    'Created At': new Date(campaign.created_at).toLocaleString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">View and manage all campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={loading} />
          <Button onClick={() => router.push('/campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <Card className="border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All Campaigns</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="running">Running</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={filters.clientId}
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.campaignMode}
                onChange={(e) => setFilters({ ...filters, campaignMode: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Modes</option>
                <option value="client_mode">Client Mode</option>
                <option value="internal_mode">Internal Mode</option>
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="End Date"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    status: '',
                    clientId: '',
                    search: '',
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    startDate: '',
                    endDate: '',
                    campaignMode: '',
                  })
                }}
              >
                Clear Filters
              </Button>
              <ExportButton
                data={exportData}
                filename="campaigns"
                columns={[
                  { key: 'Name', label: 'Name' },
                  { key: 'Status', label: 'Status' },
                  { key: 'Client', label: 'Client' },
                  { key: 'Budget', label: 'Budget' },
                  { key: 'Created At', label: 'Created At' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BulkActionBar
            selectedCount={selectedRows.size}
            actions={[
              {
                label: 'Activate',
                action: () => handleBulkStatusUpdate('running'),
                icon: <Play className="h-4 w-4 mr-2" />,
              },
              {
                label: 'Pause',
                action: () => handleBulkStatusUpdate('paused'),
                icon: <Pause className="h-4 w-4 mr-2" />,
              },
              {
                label: 'Complete',
                action: () => handleBulkStatusUpdate('completed'),
                icon: <CheckCircle className="h-4 w-4 mr-2" />,
              },
              {
                label: 'Delete',
                action: handleBulkDelete,
                variant: 'destructive',
                icon: <Trash2 className="h-4 w-4 mr-2" />,
              },
            ]}
            onClearSelection={() => setSelectedRows(new Set())}
          />
          <DataTable
            data={campaigns}
            columns={columns}
            loading={loading}
            searchable={false}
            onRowClick={(row) => router.push(`/campaigns/${row.id}`)}
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            pageSize={pageSize}
            showPagination={true}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        title="Delete Campaigns"
        description={`Are you sure you want to delete ${selectedRows.size} campaign(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmationDialog
        open={showStatusDialog}
        title="Update Campaign Status"
        description={`Are you sure you want to update ${selectedRows.size} campaign(s) to "${pendingStatus}"?`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmBulkStatusUpdate}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
