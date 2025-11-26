'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building2, FolderKanban, TrendingUp, DollarSign, UserCheck, Plus, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { usePolling } from '@/lib/hooks/usePolling'

export default function DashboardContent() {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [performance, setPerformance] = useState<any>(null)
  const [topPerformers, setTopPerformers] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)

  // Load summary with polling
  const { data: summaryData, loading: summaryLoading, lastUpdated, refetch } = usePolling<{ summary: any }>(
    async () => {
      const response = await fetch('/admin/api/dashboard/summary')
      if (!response.ok) throw new Error('Failed to fetch summary')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData.summary)
    }
  }, [summaryData])

  useEffect(() => {
    loadActivities()
    loadPerformance()
    loadTopPerformers()
    loadHealth()
  }, [])

  const loadActivities = async () => {
    try {
      const response = await fetch('/admin/api/dashboard/activity?limit=10')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  const loadPerformance = async () => {
    try {
      const response = await fetch('/admin/api/dashboard/performance')
      if (response.ok) {
        const data = await response.json()
        setPerformance(data)
      }
    } catch (error) {
      console.error('Error loading performance:', error)
    }
  }

  const loadTopPerformers = async () => {
    try {
      const response = await fetch('/admin/api/dashboard/top-performers?limit=5')
      if (response.ok) {
        const data = await response.json()
        setTopPerformers(data)
      }
    } catch (error) {
      console.error('Error loading top performers:', error)
    }
  }

  const loadHealth = async () => {
    try {
      const response = await fetch('/admin/api/dashboard/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Error loading health:', error)
    }
  }

  const kpiCards = [
    {
      title: 'Total Users',
      value: summary?.totalUsers || 0,
      icon: Users,
      description: 'All platform users',
    },
    {
      title: 'Total Clients',
      value: summary?.totalClients || 0,
      icon: Building2,
      description: 'Client organizations',
    },
    {
      title: 'Active Campaigns',
      value: summary?.activeCampaigns || 0,
      icon: FolderKanban,
      description: 'Currently running',
    },
    {
      title: 'Contributors',
      value: summary?.totalContributors || 0,
      icon: UserCheck,
      description: 'Active contributors',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and key metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={summaryLoading} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/campaigns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Campaign
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/clients/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Client
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/users/new')}>
              <Plus className="h-4 w-4 mr-2" />
              User
            </Button>
          </div>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <Card className={`border-${health.status === 'healthy' ? 'green' : 'yellow'}-500/20`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {health.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                System Health
              </CardTitle>
              {health.maintenanceMode && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500">
                  Maintenance Mode
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{health.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Database</div>
                <div className="font-medium capitalize">{health.database}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Check</div>
                <div className="font-medium">
                  {new Date(health.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-5 w-5 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.type} • {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (activity.type === 'campaign') router.push(`/campaigns/${activity.id}`)
                        else if (activity.type === 'client') router.push(`/clients/${activity.id}`)
                        else if (activity.type === 'user') router.push(`/users/${activity.id}`)
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Leading clients and contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Top Clients</h3>
                <div className="space-y-2">
                  {topPerformers?.topClients?.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No data</div>
                  ) : (
                    topPerformers?.topClients?.map((client: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.campaign_count} campaigns</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/clients/${client.client_id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Top Contributors</h3>
                <div className="space-y-2">
                  {topPerformers?.topContributors?.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No data</div>
                  ) : (
                    topPerformers?.topContributors?.map((contributor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{contributor.name || contributor.email}</div>
                          <div className="text-xs text-muted-foreground">{contributor.answer_count} answers</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/users/${contributor.contributor_id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      {performance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performance.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(6, 182, 212)"
                    fill="rgba(6, 182, 212, 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Campaign Activity</CardTitle>
              <CardDescription>Campaigns created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performance.campaignActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    dot={{ fill: 'rgb(59, 130, 246)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
