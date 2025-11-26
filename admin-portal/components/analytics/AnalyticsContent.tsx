'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { ExportButton } from '@/components/shared/ExportButton'
import { usePolling } from '@/lib/hooks/usePolling'
import type { AnalyticsMetrics } from '@/types'

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

export default function AnalyticsContent() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'custom'>('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [geographic, setGeographic] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)

  // Load metrics with polling
  const { data: metricsData, loading, lastUpdated, refetch } = usePolling<AnalyticsMetrics>(
    async () => {
      const params = new URLSearchParams()
      if (timeRange === 'custom' && startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      } else {
        params.append('days', timeRange)
      }

      const response = await fetch(`/admin/api/analytics/metrics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  useEffect(() => {
    loadGeographic()
    loadPerformance()
  }, [])

  const loadGeographic = async () => {
    try {
      const response = await fetch('/admin/api/analytics/geographic')
      if (response.ok) {
        const data = await response.json()
        setGeographic(data)
      }
    } catch (error) {
      console.error('Error loading geographic data:', error)
    }
  }

  const loadPerformance = async () => {
    try {
      const response = await fetch('/admin/api/analytics/performance')
      if (response.ok) {
        const data = await response.json()
        setPerformance(data)
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const handleExport = async () => {
    const response = await fetch('/admin/api/analytics/export?format=csv')
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const metrics = metricsData || {
    totalUsers: 0,
    totalClients: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContributors: 0,
    userGrowth: [],
    campaignActivity: [],
    rewardDistribution: [],
    contributorParticipation: [],
    clientEngagement: [],
  }

  const roleDistribution = [
    { name: 'Contributors', value: metrics.totalContributors || 0 },
    { name: 'Clients', value: metrics.totalClients || 0 },
    { name: 'Team', value: (metrics.totalUsers || 0) - (metrics.totalContributors || 0) - (metrics.totalClients || 0) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform-wide analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={loading} />
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle>Time Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>
            {timeRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                />
              </>
            )}
            <Button onClick={refetch}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.response_rate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.completion_rate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm">Average Consensus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.average_consensus?.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.accuracy?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
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
              <LineChart data={metrics.campaignActivity || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Breakdown of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Contributor Participation</CardTitle>
            <CardDescription>Contributor activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.contributorParticipation || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="rgb(6, 182, 212)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Insights */}
      {geographic && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>User Distribution by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={geographic.user_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="country" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Campaign Distribution by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={geographic.campaign_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="country" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-cyan-500/20 lg:col-span-2">
        <CardHeader>
          <CardTitle>Client Engagement</CardTitle>
          <CardDescription>Client activity and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.clientEngagement || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="rgb(59, 130, 246)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
