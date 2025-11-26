'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from '@/components/ui/glass-card'
import { DataVisualizationCard, ChartContainer } from '@/components/ui/data-visualization-card'
import { GeometricShape, GeometricOverlay } from '@/components/ui/geometric-shape'
import { AnimatedCounter, AnimatedStatCard } from '@/components/ui/animated-counter'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FolderKanban, 
  HelpCircle, 
  MessageSquare, 
  Shield, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  ExternalLink,
  Database,
  Zap,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { SystemStats, SystemHealth, AdminEvent } from '@/types/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [recentEvents, setRecentEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    setupSSE()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/health'),
      ])

      if (!statsRes.ok || !healthRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const statsData = await statsRes.json()
      const healthData = await healthRes.json()

      setStats(statsData.stats)
      setHealth(healthData.health)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'connected' || data.type === 'heartbeat') {
          return
        }

        // Add to recent events (keep last 10)
        setRecentEvents(prev => {
          const newEvent: AdminEvent = {
            type: data.type,
            timestamp: data.timestamp,
            data: data.data || {},
          }
          return [newEvent, ...prev].slice(0, 10)
        })

        // Refresh stats on significant events
        if (['user_created', 'answer_submitted', 'campaign_created'].includes(data.type)) {
          loadData()
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      // Reconnect after 5 seconds
      setTimeout(setupSSE, 5000)
    }

    return () => {
      eventSource.close()
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const exportStats = () => {
    if (!stats || !health) return
    
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      health,
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-dashboard-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate chart data (mock trend data - in production, fetch historical data)
  const generateTrendData = () => {
    const days = 7
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: stats ? Math.floor(stats.users.total * (0.8 + Math.random() * 0.4)) : 0,
        answers: stats ? Math.floor(stats.answers.total * (0.8 + Math.random() * 0.4)) : 0,
        campaigns: stats ? Math.floor(stats.campaigns.total * (0.8 + Math.random() * 0.4)) : 0,
      })
    }
    return data
  }

  const trendData = generateTrendData()

  // User role distribution for pie chart
  const userDistribution = stats ? [
    { name: 'Contributors', value: stats.users.contributors, color: '#3b82f6' },
    { name: 'Companies', value: stats.users.companies, color: '#10b981' },
    { name: 'Admins', value: stats.users.admins, color: '#f59e0b' },
  ] : []

  // Campaign status distribution
  const campaignDistribution = stats ? [
    { name: 'Running', value: stats.campaigns.running, color: '#3b82f6' },
    { name: 'Draft', value: stats.campaigns.draft, color: '#6b7280' },
    { name: 'Completed', value: stats.campaigns.completed, color: '#10b981' },
    { name: 'Archived', value: stats.campaigns.archived, color: '#9ca3af' },
  ] : []

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden p-6 md:p-8">
      {/* Geometric Background Decorations */}
      <GeometricShape
        type="hexagon"
        size={300}
        top="-150px"
        right="-150px"
        color="rgba(142, 36, 170, 0.05)"
        animated
      />
      <GeometricShape
        type="diamond"
        size={250}
        bottom="-125px"
        left="-125px"
        color="rgba(255, 109, 0, 0.05)"
        animated
      />
      <GeometricShape
        type="circle"
        size={180}
        top="40%"
        left="2%"
        color="rgba(142, 36, 170, 0.03)"
        animated
      />

      <div className="max-w-[1800px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text break-words">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">System overview and monitoring</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={loadData} className="hover-3d flex-1 sm:flex-initial text-xs sm:text-sm">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportStats} disabled={!stats || !health} className="hover-3d flex-1 sm:flex-initial text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Large System Health Dashboard - Centerpiece */}
        {health && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <DataVisualizationCard
              title="System Health Dashboard"
              description="Real-time system status and performance metrics"
              gradient
              geometricOverlay
            >
              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard variant="solid-border" blur="sm" className="relative overflow-hidden">
                  <GeometricShape
                    type="circle"
                    size={80}
                    top="-20px"
                    right="-20px"
                    color="rgba(0, 230, 118, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader>
                    <GlassCardTitle className="text-sm flex items-center gap-2 relative z-10">
                      <Database className="h-4 w-4" />
                      Database
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={health.database.connected ? 'default' : 'destructive'}>
                        {health.database.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <AnimatedCounter
                      value={health.database.responseTime}
                      suffix="ms"
                      className="text-2xl font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Response Time</p>
                  </GlassCardContent>
                </GlassCard>

                <GlassCard variant="solid-border" blur="sm" className="relative overflow-hidden">
                  <GeometricShape
                    type="triangle"
                    size={70}
                    bottom="-15px"
                    left="-15px"
                    color="rgba(142, 36, 170, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader>
                    <GlassCardTitle className="text-sm flex items-center gap-2 relative z-10">
                      <Zap className="h-4 w-4" />
                      API Performance
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <AnimatedCounter
                        value={health.api.averageResponseTime}
                        suffix="ms"
                        className="text-2xl font-bold"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Error Rate: <AnimatedCounter value={health.api.errorRate} suffix="%" />
                    </p>
                  </GlassCardContent>
                </GlassCard>

                <GlassCard variant="solid-border" blur="sm" className="relative overflow-hidden">
                  <GeometricShape
                    type="hexagon"
                    size={75}
                    top="-25px"
                    right="-25px"
                    color="rgba(255, 109, 0, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader>
                    <GlassCardTitle className="text-sm flex items-center gap-2 relative z-10">
                      <Activity className="h-4 w-4" />
                      System Status
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10">
                    <Badge
                      variant={health.status === 'healthy' ? 'default' : 'destructive'}
                      className="text-lg px-4 py-2 mb-2"
                    >
                      {health.status.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Active Campaigns: <AnimatedCounter value={health.activeCampaigns} />
                    </p>
                    {health.pendingFlaggedAnswers > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {health.pendingFlaggedAnswers} flagged answers pending
                      </p>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </div>
            </DataVisualizationCard>
          </motion.div>
        )}

        {/* Multi-Panel Layout: Stats and Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel: Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Glassmorphic Metric Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[
                  {
                    label: 'Users',
                    value: stats.users.total,
                    icon: Users,
                    details: [
                      { label: 'Contributors', value: stats.users.contributors },
                      { label: 'Companies', value: stats.users.companies },
                      { label: 'Admins', value: stats.users.admins },
                    ],
                    newToday: stats.users.newToday,
                  },
                  {
                    label: 'Campaigns',
                    value: stats.campaigns.total,
                    icon: FolderKanban,
                    details: [
                      { label: 'Running', value: stats.campaigns.running },
                      { label: 'Draft', value: stats.campaigns.draft },
                      { label: 'Completed', value: stats.campaigns.completed },
                    ],
                  },
                  {
                    label: 'Questions',
                    value: stats.questions.total,
                    icon: HelpCircle,
                    details: [
                      { label: 'Active', value: stats.questions.active },
                      { label: 'Completed', value: stats.questions.completed },
                      { label: 'Archived', value: stats.questions.archived },
                    ],
                  },
                  {
                    label: 'Answers',
                    value: stats.answers.total,
                    icon: MessageSquare,
                    details: [
                      { label: 'Validated', value: stats.answers.validated },
                      { label: 'Pending', value: stats.answers.pending },
                      { label: 'Flagged', value: stats.answers.flagged },
                    ],
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                      <GeometricShape
                        type={index % 2 === 0 ? 'circle' : 'hexagon'}
                        size={50}
                        top={index % 2 === 0 ? '3px' : '-15px'}
                        right={index % 2 === 0 ? '3px' : '-15px'}
                        color="rgba(142, 36, 170, 0.1)"
                        position="absolute"
                        zIndex={0}
                      />
                      <GlassCardHeader className="p-3 sm:p-4">
                        <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                          <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{stat.label}</span>
                        </GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                        <AnimatedCounter
                          value={stat.value}
                          className="text-lg sm:text-xl md:text-2xl font-bold block mb-2"
                        />
                        {stat.newToday && stat.newToday > 0 && (
                          <p className="text-xs text-primary mb-2">+{stat.newToday} today</p>
                        )}
                        <div className="space-y-1">
                          {stat.details.map((detail, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-muted-foreground truncate flex-1 min-w-0">{detail.label}:</span>
                              <AnimatedCounter value={detail.value} className="font-medium ml-2 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Charts Section */}
            {stats && (
              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <DataVisualizationCard
                    title="7-Day Trends"
                    description="Growth trends over the past week"
                    geometricOverlay
                  >
                    <ChartContainer height={250} className="sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis 
                            dataKey="date" 
                            stroke="rgba(255, 255, 255, 0.5)" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="rgba(255, 255, 255, 0.5)" 
                            tick={{ fontSize: 12 }}
                            width={40}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="users" stroke="#8E24AA" strokeWidth={2} name="Users" />
                          <Line type="monotone" dataKey="answers" stroke="#00E676" strokeWidth={2} name="Answers" />
                          <Line type="monotone" dataKey="campaigns" stroke="#FF6D00" strokeWidth={2} name="Campaigns" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </DataVisualizationCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <DataVisualizationCard
                    title="User Distribution"
                    description="Breakdown by user role"
                    geometricOverlay
                  >
                    <ChartContainer height={250} className="sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {userDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </DataVisualizationCard>
                </motion.div>
              </div>
            )}

            {/* Additional Stats Row */}
            {stats && (
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                    <GeometricShape
                      type="circle"
                      size={90}
                      top="-30px"
                      right="-30px"
                      color="rgba(142, 36, 170, 0.1)"
                      position="absolute"
                      zIndex={0}
                    />
                    <GlassCardHeader>
                      <GlassCardTitle className="text-sm flex items-center gap-2 relative z-10">
                        <Award className="h-4 w-4" />
                        Rewards
                      </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="relative z-10">
                      <AnimatedCounter
                        value={stats.rewards.total}
                        className="text-2xl font-bold block mb-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Total Value: <AnimatedCounter value={stats.rewards.totalValue} formatValue={(v) => `$${v.toFixed(2)}`} />
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Pending: <AnimatedCounter value={stats.rewards.pending} /></span>
                        <span>Awarded: <AnimatedCounter value={stats.rewards.awarded} /></span>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                    <GeometricShape
                      type="triangle"
                      size={85}
                      bottom="-25px"
                      left="-25px"
                      color="rgba(255, 109, 0, 0.1)"
                      position="absolute"
                      zIndex={0}
                    />
                    <GlassCardHeader>
                      <GlassCardTitle className="text-sm flex items-center gap-2 relative z-10">
                        <Zap className="h-4 w-4" />
                        API Usage
                      </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="relative z-10">
                      <AnimatedCounter
                        value={stats.api.totalRequests}
                        formatValue={(v) => v.toLocaleString()}
                        className="text-2xl font-bold block mb-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Last Hour: <AnimatedCounter value={stats.api.requestsLastHour} />
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Active Keys: <AnimatedCounter value={stats.api.activeKeys} /></span>
                        {stats.api.rateLimitHits > 0 && (
                          <span className="text-destructive">
                            Rate Limits: <AnimatedCounter value={stats.api.rateLimitHits} />
                          </span>
                        )}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </motion.div>
              </div>
            )}
          </div>

          {/* Right Panel: Quick Actions and Activity */}
          <div className="space-y-6">
            {/* Geometric Quick Action Grid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden">
                <GeometricOverlay
                  shapes={[
                    { type: 'hexagon', size: 120, top: '10%', right: '5%', color: 'rgba(142, 36, 170, 0.05)' },
                  ]}
                  className="absolute inset-0"
                />
                <GlassCardHeader gradient>
                  <GlassCardTitle className="text-white">Quick Actions</GlassCardTitle>
                  <GlassCardDescription className="text-white/90">
                    Navigate to key sections
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { href: '/admin/users', icon: Users, label: 'Users', color: 'rgba(142, 36, 170, 0.1)' },
                      { href: '/admin/campaigns', icon: FolderKanban, label: 'Campaigns', color: 'rgba(255, 109, 0, 0.1)' },
                      { href: '/admin/questions', icon: HelpCircle, label: 'Questions', color: 'rgba(142, 36, 170, 0.1)' },
                      { href: '/admin/answers', icon: MessageSquare, label: 'Answers', color: 'rgba(0, 230, 118, 0.1)' },
                      { href: '/admin/security', icon: Shield, label: 'Security', color: 'rgba(255, 82, 82, 0.1)' },
                      { href: '/admin/config', icon: Database, label: 'Config', color: 'rgba(255, 109, 0, 0.1)' },
                    ].map((action, index) => (
                      <Link key={action.href} href={action.href}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <GlassCard
                            variant="solid-border"
                            blur="sm"
                            hover
                            className="cursor-pointer hover-3d-lift relative overflow-hidden"
                          >
                            <div
                              className="absolute inset-0 opacity-50"
                              style={{ backgroundColor: action.color }}
                            />
                            <GlassCardContent className="p-4 relative z-10 flex flex-col items-center justify-center min-h-[80px]">
                              <action.icon className="h-6 w-6 mb-2" />
                              <span className="text-xs font-medium text-center">{action.label}</span>
                            </GlassCardContent>
                          </GlassCard>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            {/* Enhanced Activity Feed with Glassmorphic Items */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden">
                <GeometricOverlay
                  shapes={[
                    { type: 'triangle', size: 100, bottom: '5%', left: '5%', color: 'rgba(255, 109, 0, 0.05)' },
                  ]}
                  className="absolute inset-0"
                />
                <GlassCardHeader gradient>
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <GlassCardTitle className="text-white flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                      </GlassCardTitle>
                      <GlassCardDescription className="text-white/90">
                        Real-time system events
                      </GlassCardDescription>
                    </div>
                    {recentEvents.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white/80 hover:bg-white/10"
                        onClick={() => setRecentEvents([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10 max-h-[500px] overflow-y-auto">
                  {recentEvents.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-12">
                      No recent activity
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentEvents.map((event, index) => {
                        const eventIcons: Record<string, any> = {
                          user_created: Users,
                          user_updated: Users,
                          answer_submitted: MessageSquare,
                          question_created: HelpCircle,
                          campaign_created: FolderKanban,
                          campaign_updated: FolderKanban,
                          flagged_answer: AlertTriangle,
                          api_usage: Shield,
                        }
                        const Icon = eventIcons[event.type] || Activity
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <GlassCard
                              variant="solid-border"
                              blur="sm"
                              hover
                              className="hover-3d-lift cursor-pointer"
                            >
                              <GlassCardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg glass-card-sm">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {event.type.replace(/_/g, ' ')}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {event.data && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {event.data.email && `User: ${event.data.email}`}
                                        {event.data.name && `Campaign: ${event.data.name}`}
                                        {event.data.content && `Question: ${event.data.content.substring(0, 40)}...`}
                                        {event.data.answer_text && `Answer: ${event.data.answer_text.substring(0, 40)}...`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </GlassCardContent>
                            </GlassCard>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

