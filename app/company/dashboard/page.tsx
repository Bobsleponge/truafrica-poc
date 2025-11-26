'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardHeaderGradient } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from '@/components/ui/glass-card'
import { DataVisualizationCard, ChartContainer } from '@/components/ui/data-visualization-card'
import { GeometricShape, GeometricOverlay } from '@/components/ui/geometric-shape'
import { AnimatedCounter, AnimatedStatCard } from '@/components/ui/animated-counter'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Users, FileText, Key, ArrowRight, Activity } from 'lucide-react'
import type { User, Campaign } from '@/types/database'

export default function CompanyDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<User | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    runningCampaigns: 0,
    totalResponses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (userError) throw userError
      if (userData.role !== 'company') {
        router.push('/')
        return
      }
      setProfile(userData)

      // Load campaigns
      const response = await fetch('/api/campaigns')
      const campaignsData = await response.json()
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || [])
        
        // Calculate stats
        const totalCampaigns = campaignsData.campaigns?.length || 0
        const runningCampaigns = campaignsData.campaigns?.filter((c: Campaign) => c.status === 'running').length || 0
        
        // Get total responses
        let totalResponses = 0
        
        for (const campaign of campaignsData.campaigns || []) {
          const { data: questions } = await supabase
            .from('campaign_questions')
            .select('question_id')
            .eq('campaign_id', campaign.id)
          
          const questionIds = (questions || []).map((q: any) => q.question_id)
          if (questionIds.length > 0) {
            const { count } = await supabase
              .from('answers')
              .select('*', { count: 'exact', head: true })
              .in('question_id', questionIds)
            totalResponses += count || 0
          }
        }
        
        setStats({
          totalCampaigns,
          runningCampaigns,
          totalResponses,
        })
      }

      // Load API keys
      const apiResponse = await fetch('/api/auth/api-key')
      const apiData = await apiResponse.json()
      if (apiData.success) {
        setApiKeys(apiData.apiKeys || [])
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading dashboard...</div>
      </div>
    )
  }

  if (!profile) return null

  // Generate response trend data
  const responseData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      responses: Math.floor(stats.totalResponses * (0.7 + Math.random() * 0.6) / 7),
    }
  })

  // Campaign timeline data
  const campaignTimeline = campaigns.slice(0, 5).map((campaign, index) => ({
    name: campaign.name,
    date: new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: campaign.status,
    index,
  }))

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden p-4 md:p-8">
      {/* Geometric Background Decorations */}
      <GeometricShape
        type="diamond"
        size={250}
        top="-125px"
        right="-125px"
        color="rgba(142, 36, 170, 0.05)"
        animated
      />
      <GeometricShape
        type="circle"
        size={200}
        bottom="-100px"
        left="-100px"
        color="rgba(255, 109, 0, 0.05)"
        animated
      />

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text break-words">Company Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">Welcome, {profile.name || 'Company'}</p>
          </div>
          <Button
            onClick={() => router.push('/company/campaigns/builder')}
            variant="gradient"
            className="hover-3d w-full sm:w-auto text-sm sm:text-base"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </motion.div>

        {/* Split Screen Layout: Stats Left (60%), Campaigns Right (40%) */}
        <div className="split-screen">
          {/* Left Side: Stats and Visualizations */}
          <div className="space-y-6">
            {/* Animated Stats Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                  <GeometricShape
                    type="hexagon"
                    size={50}
                    top="3px"
                    right="3px"
                    color="rgba(142, 36, 170, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader className="p-3 sm:p-4">
                    <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Campaigns</span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                    <AnimatedStatCard
                      label="Total"
                      value={stats.totalCampaigns}
                      icon={<FileText className="h-3 w-3 sm:h-4 sm:w-4" />}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      <AnimatedCounter value={stats.runningCampaigns} /> running
                    </p>
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                  <GeometricShape
                    type="circle"
                    size={60}
                    bottom="-5px"
                    left="-5px"
                    color="rgba(255, 109, 0, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader className="p-3 sm:p-4">
                    <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Responses</span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                    <AnimatedStatCard
                      label="Total"
                      value={stats.totalResponses}
                      icon={<Users className="h-3 w-3 sm:h-4 sm:w-4" />}
                    />
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                  <GeometricShape
                    type="hexagon"
                    size={50}
                    bottom="3px"
                    right="3px"
                    color="rgba(255, 109, 0, 0.1)"
                    position="absolute"
                    zIndex={0}
                  />
                  <GlassCardHeader className="p-3 sm:p-4">
                    <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                      <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">API Keys</span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                    <AnimatedStatCard
                      label="Active"
                      value={apiKeys.filter(k => !k.revoked_at).length}
                      icon={<Key className="h-3 w-3 sm:h-4 sm:w-4" />}
                    />
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            </div>

            {/* Response Trends Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <DataVisualizationCard
                title="Response Trends"
                description="7-day performance overview"
                gradient
                geometricOverlay
              >
                <ChartContainer height={250} className="sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseData}>
                      <defs>
                        <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6D00" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF6D00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <Area
                        type="monotone"
                        dataKey="responses"
                        stroke="#FF6D00"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#responseGradient)"
                        name="Responses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </DataVisualizationCard>
            </motion.div>

            {/* Quick Actions with Glassmorphic Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GlassCard
                  variant="gradient-border"
                  blur="md"
                  hover
                  floating
                  className="cursor-pointer hover-3d relative overflow-hidden"
                  onClick={() => router.push('/company/campaigns')}
                >
                  <GeometricOverlay
                    shapes={[
                      { type: 'circle', size: 60, top: '-15px', right: '-15px', color: 'rgba(142, 36, 170, 0.1)' },
                    ]}
                    className="absolute inset-0"
                  />
                  <GlassCardHeader gradient className="p-3 sm:p-4">
                    <GlassCardTitle className="text-white flex items-center gap-1.5 sm:gap-2 relative z-10 text-sm sm:text-base">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <span>View Campaigns</span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                    <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
                      Manage campaigns and insights
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" />
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <GlassCard
                  variant="gradient-border"
                  blur="md"
                  hover
                  floating
                  className="cursor-pointer hover-3d relative overflow-hidden"
                  onClick={() => router.push('/company/campaigns/builder')}
                >
                  <GeometricOverlay
                    shapes={[
                      { type: 'triangle', size: 60, bottom: '-15px', left: '-15px', color: 'rgba(255, 109, 0, 0.1)' },
                    ]}
                    className="absolute inset-0"
                  />
                  <GlassCardHeader gradient className="p-3 sm:p-4">
                    <GlassCardTitle className="text-white flex items-center gap-1.5 sm:gap-2 relative z-10 text-sm sm:text-base">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <span>Create Campaign</span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="relative z-10 p-3 sm:p-4 pt-0">
                    <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
                      Start new data collection
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" />
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            </div>
          </div>

          {/* Right Side: Campaigns List */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden">
                <GeometricOverlay
                  shapes={[
                    { type: 'hexagon', size: 100, top: '10%', right: '5%', color: 'rgba(142, 36, 170, 0.05)' },
                  ]}
                  className="absolute inset-0"
                />
                <GlassCardHeader gradient className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 relative z-10">
                    <div className="min-w-0 flex-1">
                      <GlassCardTitle className="text-white text-sm sm:text-base">Recent Campaigns</GlassCardTitle>
                      <GlassCardDescription className="text-white/90 text-xs sm:text-sm">
                        Your latest data collection campaigns
                      </GlassCardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white/80 text-xs sm:text-sm shrink-0"
                      onClick={() => router.push('/company/campaigns')}
                    >
                      View All
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10 p-3 sm:p-4">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">No campaigns yet</p>
                      <Button
                        onClick={() => router.push('/company/campaigns/builder')}
                        variant="gradient"
                        className="hover-3d text-sm sm:text-base"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {campaigns.slice(0, 5).map((campaign, index) => (
                        <motion.div
                          key={campaign.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <GlassCard
                            variant="solid-border"
                            blur="sm"
                            hover
                            className="cursor-pointer hover-3d-lift"
                            onClick={() => router.push(`/company/campaigns/${campaign.id}`)}
                          >
                            <GlassCardContent className="p-3 sm:p-4">
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h3 className="font-semibold text-xs sm:text-sm truncate flex-1 min-w-0">{campaign.name}</h3>
                                <Badge
                                  variant={campaign.status === 'running' ? 'default' : 'outline'}
                                  className="text-xs shrink-0"
                                >
                                  {campaign.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {campaign.description || 'No description'}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                                <Activity className="h-3 w-3 shrink-0" />
                              </div>
                            </GlassCardContent>
                          </GlassCard>
                        </motion.div>
                      ))}
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

