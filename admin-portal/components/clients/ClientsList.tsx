'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Building2, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { ExportButton } from '@/components/shared/ExportButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { usePolling } from '@/lib/hooks/usePolling'
import type { Client } from '@/types'

interface ClientWithCount extends Client {
  campaign_count?: number
}

export default function ClientsList() {
  const router = useRouter()
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    startDate: '',
    endDate: '',
    industry: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('')

  // Load clients with polling
  const { data, loading, lastUpdated, refetch } = usePolling<{
    clients: ClientWithCount[]
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
      if (filters.search) params.append('search', filters.search)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.industry) params.append('industry', filters.industry)

      const response = await fetch(`/admin/api/clients/list?${params}`)
      if (!response.ok) throw new Error('Failed to fetch clients')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const clients = data?.clients || []

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.size === 0) return

    setPendingStatus(status)
    setShowStatusDialog(true)
  }

  const confirmBulkStatusUpdate = async () => {
    try {
      const response = await fetch('/admin/api/clients/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: Array.from(selectedRows),
          status: pendingStatus,
        }),
      })

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowStatusDialog(false)
      } else {
        alert('Failed to update clients')
      }
    } catch (error) {
      console.error('Error updating clients:', error)
      alert('Error updating clients')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    setShowDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch(
        `/admin/api/clients/bulk-delete?ids=${Array.from(selectedRows).join(',')}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowDeleteDialog(false)
      } else {
        alert('Failed to delete clients')
      }
    } catch (error) {
      console.error('Error deleting clients:', error)
      alert('Error deleting clients')
    }
  }

  const columns: Column<ClientWithCount>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Building2 className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.contact_email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact_email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'contact_phone',
      label: 'Phone',
      sortable: false,
      render: (value) => value || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'campaign_count',
      label: 'Campaigns',
      sortable: true,
      render: (value) => value || 0,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ]

  const exportData = clients.map((client) => ({
    Name: client.name,
    Email: client.contact_email,
    Phone: client.contact_phone || '',
    Status: client.status,
    'Campaign Count': client.campaign_count || 0,
    'Created At': new Date(client.created_at).toLocaleString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage all client organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={loading} />
          <Button onClick={() => router.push('/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Client
          </Button>
        </div>
      </div>

      <Card className="border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All Clients</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
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
                    search: '',
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    startDate: '',
                    endDate: '',
                    industry: '',
                  })
                }}
              >
                Clear Filters
              </Button>
              <ExportButton
                data={exportData}
                filename="clients"
                columns={[
                  { key: 'Name', label: 'Name' },
                  { key: 'Email', label: 'Email' },
                  { key: 'Status', label: 'Status' },
                  { key: 'Campaign Count', label: 'Campaign Count' },
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
                action: () => handleBulkStatusUpdate('active'),
                icon: <CheckCircle className="h-4 w-4 mr-2" />,
              },
              {
                label: 'Suspend',
                action: () => handleBulkStatusUpdate('suspended'),
                icon: <XCircle className="h-4 w-4 mr-2" />,
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
            data={clients}
            columns={columns}
            loading={loading}
            searchable={false}
            onRowClick={(row) => router.push(`/clients/${row.id}`)}
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
        title="Delete Clients"
        description={`Are you sure you want to delete ${selectedRows.size} client(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmationDialog
        open={showStatusDialog}
        title="Update Client Status"
        description={`Are you sure you want to update ${selectedRows.size} client(s) to "${pendingStatus}"?`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmBulkStatusUpdate}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
