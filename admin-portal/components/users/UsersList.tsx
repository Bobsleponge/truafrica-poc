'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, User, Plus, Trash2, Edit } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { ExportButton } from '@/components/shared/ExportButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { usePolling } from '@/lib/hooks/usePolling'
import type { User as UserType } from '@/types'

export default function UsersList() {
  const router = useRouter()
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    startDate: '',
    endDate: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [pendingRole, setPendingRole] = useState<string>('')

  const { data, loading, lastUpdated, refetch } = usePolling<{
    users: UserType[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>(
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      if (filters.role) params.append('role', filters.role)
      if (filters.search) params.append('search', filters.search)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/admin/api/users/list?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const users = data?.users || []

  const handleBulkRoleUpdate = () => {
    if (selectedRows.size === 0) return
    setShowRoleDialog(true)
  }

  const confirmBulkRoleUpdate = async () => {
    try {
      const response = await fetch('/admin/api/users/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedRows),
          role: pendingRole,
        }),
      })

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowRoleDialog(false)
      } else {
        alert('Failed to update users')
      }
    } catch (error) {
      console.error('Error updating users:', error)
      alert('Error updating users')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    setShowDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch(
        `/admin/api/users/bulk-delete?ids=${Array.from(selectedRows).join(',')}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setSelectedRows(new Set())
        refetch()
        setShowDeleteDialog(false)
      } else {
        alert('Failed to delete users')
      }
    } catch (error) {
      console.error('Error deleting users:', error)
      alert('Error deleting users')
    }
  }

  const columns: Column<UserType>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <User className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            {row.name && (
              <div className="text-xs text-muted-foreground">{row.name}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString() : 'Never',
    },
  ]

  const exportData = users.map((user) => ({
    Email: user.email,
    Name: user.name || '',
    Role: user.role,
    'Created At': new Date(user.created_at).toLocaleString(),
    'Last Login': user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={loading} />
          <Button onClick={() => router.push('/users/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <Card className="border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Roles</option>
                <option value="platform_admin">Platform Admin</option>
                <option value="client">Client</option>
                <option value="team">Team</option>
                <option value="contributor">Contributor</option>
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    role: '',
                    search: '',
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    startDate: '',
                    endDate: '',
                  })
                }}
              >
                Clear Filters
              </Button>
              <ExportButton
                data={exportData}
                filename="users"
                columns={[
                  { key: 'Email', label: 'Email' },
                  { key: 'Role', label: 'Role' },
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
                label: 'Update Role',
                action: handleBulkRoleUpdate,
                icon: <Edit className="h-4 w-4 mr-2" />,
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
            data={users}
            columns={columns}
            loading={loading}
            searchable={false}
            onRowClick={(row) => router.push(`/users/${row.id}`)}
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
        title="Delete Users"
        description={`Are you sure you want to delete ${selectedRows.size} user(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmationDialog
        open={showRoleDialog}
        title="Update User Role"
        description={`Select a role for ${selectedRows.size} user(s):`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmBulkRoleUpdate}
        onCancel={() => setShowRoleDialog(false)}
      >
        <select
          value={pendingRole}
          onChange={(e) => setPendingRole(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background mt-4"
        >
          <option value="">Select Role</option>
          <option value="platform_admin">Platform Admin</option>
          <option value="client">Client</option>
          <option value="team">Team</option>
          <option value="contributor">Contributor</option>
        </select>
      </ConfirmationDialog>
    </div>
  )
}
