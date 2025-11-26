'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Mail,
  Edit,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  BarChart3,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { InlineEditForm } from '@/components/shared/InlineEditForm'
import { DataTable, Column } from '@/components/shared/DataTable'
import { usePolling } from '@/lib/hooks/usePolling'
import type { User as UserType } from '@/types'

interface UserDetailProps {
  userId: string
}

export default function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'statistics'>('overview')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string>('')
  const [activity, setActivity] = useState<any>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Load user with polling
  const { data: userData, loading: userLoading, lastUpdated, refetch } = usePolling<{ user: UserType }>(
    async () => {
      const response = await fetch(`/admin/api/users/get?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const user = userData?.user

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivity()
    } else if (activeTab === 'statistics') {
      loadStatistics()
    }
  }, [activeTab, userId])

  const loadActivity = async () => {
    setLoadingActivity(true)
    try {
      const response = await fetch(`/admin/api/users/${userId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivity(data.activity)
      }
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const loadStatistics = async () => {
    setLoadingStatistics(true)
    try {
      const response = await fetch(`/admin/api/users/${userId}/statistics`)
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

  const handleUpdateRole = async () => {
    if (!user || selectedRole === user.role) return

    setUpdating(true)
    try {
      const response = await fetch('/admin/api/users/update-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: selectedRole,
        }),
      })

      if (response.ok) {
        refetch()
        setUpdating(false)
      } else {
        alert('Failed to update role')
        setUpdating(false)
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error updating role')
      setUpdating(false)
    }
  }

  const handleStatusUpdate = (status: string) => {
    setPendingStatus(status)
    setShowStatusDialog(true)
  }

  const confirmStatusUpdate = async () => {
    try {
      const response = await fetch('/admin/api/users/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
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

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading user details...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => router.push('/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    )
  }

  const activityColumns: Column<any>[] = [
    { key: 'question_id', label: 'Question ID', sortable: true },
    { key: 'created_at', label: 'Date', sortable: true, render: (v) => new Date(v as string).toLocaleString() },
    { key: 'consensus_score', label: 'Consensus', sortable: true, render: (v) => v ? Number(v).toFixed(2) : '-' },
    { key: 'correct', label: 'Correct', sortable: true, render: (v) => v ? 'Yes' : 'No' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={userLoading} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('active')}
              disabled={user.status === 'active'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('suspended')}
              disabled={user.status === 'suspended'}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('banned')}
              disabled={user.status === 'banned'}
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'activity', label: 'Activity', icon: Activity },
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
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic user details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-cyan-500" />
                <div>
                  <div className="text-sm text-muted-foreground">User ID</div>
                  <div className="font-medium font-mono text-xs">{user.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{user.email}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Current Role</div>
                <StatusBadge status={user.role} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
              {user.last_login && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Login</div>
                  <div className="font-medium">
                    {new Date(user.last_login).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Update user role and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="platform_admin">Platform Admin</option>
                  <option value="client">Client</option>
                  <option value="team">Team</option>
                  <option value="contributor">Contributor</option>
                </select>
              </div>
              <Button
                onClick={handleUpdateRole}
                disabled={updating || selectedRole === user.role}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Role'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && activity && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>User activity and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Recent Answers</h3>
                <DataTable
                  data={activity.answers || []}
                  columns={activityColumns}
                  loading={loadingActivity}
                />
              </div>
              {activity.campaigns && activity.campaigns.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Campaigns</h3>
                  <div className="space-y-2">
                    {activity.campaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString()} - {campaign.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'statistics' && statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statistics.total_answers !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Total Answers</div>
                  <div className="text-2xl font-bold">{statistics.total_answers}</div>
                </div>
              )}
              {statistics.trust_score !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Trust Score</div>
                  <div className="text-2xl font-bold">{statistics.trust_score}</div>
                </div>
              )}
              {statistics.participation_rate !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Participation Rate</div>
                  <div className="text-2xl font-bold">{statistics.participation_rate} per day</div>
                </div>
              )}
              {statistics.total_campaigns !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                  <div className="text-2xl font-bold">{statistics.total_campaigns}</div>
                </div>
              )}
              {statistics.total_spend !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="text-2xl font-bold">
                    ${statistics.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {statistics.reward_history && statistics.reward_history.length > 0 && (
            <Card className="border-cyan-500/20">
              <CardHeader>
                <CardTitle>Reward History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.reward_history.slice(0, 10).map((reward: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{reward.reward_type}</div>
                      <div className="text-sm text-muted-foreground">
                        ${reward.value} - {new Date(reward.awarded_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ConfirmationDialog
        open={showStatusDialog}
        title="Update User Status"
        description={`Are you sure you want to update this user to "${pendingStatus}"?`}
        confirmLabel="Update"
        cancelLabel="Cancel"
        onConfirm={confirmStatusUpdate}
        onCancel={() => setShowStatusDialog(false)}
      />
    </div>
  )
}
