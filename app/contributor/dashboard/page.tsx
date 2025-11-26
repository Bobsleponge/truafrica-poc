'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardHeaderGradient } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from '@/components/ui/glass-card'
import { DataVisualizationCard, ChartContainer } from '@/components/ui/data-visualization-card'
import { GeometricShape, GeometricOverlay } from '@/components/ui/geometric-shape'
import { AnimatedCounter, AnimatedStatCard } from '@/components/ui/animated-counter'
import { Button } from '@/components/ui/button'
import { TrustScoreBadge } from '@/components/contributor/TrustScoreBadge'
import { RewardHistory } from '@/components/contributor/RewardHistory'
import { ProfileSection } from '@/components/contributor/ProfileSection'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Particles } from '@/components/ui/Particles'
import { RadialProgress } from '@/components/ui/radial-progress'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { 
  Bell, 
  User, 
  Menu, 
  X, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import type { User, Answer, Reward } from '@/types/database'

export default function ContributorDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<User | null>(null)
  const [recentAnswers, setRecentAnswers] = useState<(Answer & { question_content?: string })[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (userError) throw userError
      setProfile(userData)

      if (!userData.onboarding_completed) {
        router.push('/contributor/onboarding')
        return
      }

      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select(`
          *,
          questions:question_id (
            content
          )
        `)
        .eq('contributor_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (answersError) throw answersError
      setRecentAnswers(
        answersData.map((a: any) => ({
          ...a,
          question_content: a.questions?.content,
        }))
      )

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('contributor_id', user!.id)
        .order('awarded_at', { ascending: false })
        .limit(20)

      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (!profile) return null

  const correctAnswers = recentAnswers.filter(a => a.correct).length
  const totalAnswers = recentAnswers.length
  const successRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
  const totalRewards = rewards.reduce((sum, r) => sum + Number(r.value), 0)

  // Generate answer history chart data
  const answerHistoryData = recentAnswers.slice().reverse().map((answer, index) => ({
    day: `Day ${index + 1}`,
    answers: 1,
    correct: answer.correct === true ? 1 : 0,
    consensus: answer.consensus_score || 0,
  }))

  // Generate performance trend data
  const performanceData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayAnswers = recentAnswers.filter(a => {
      const answerDate = new Date(a.created_at)
      return answerDate.toDateString() === date.toDateString()
    })
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      answers: dayAnswers.length,
      correct: dayAnswers.filter(a => a.correct === true).length,
    }
  })

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden">
      <Particles count={20} />
      
      {/* Geometric Background Decorations */}
      <GeometricShape
        type="circle"
        size={300}
        top="-150px"
        right="-150px"
        color="rgba(142, 36, 170, 0.05)"
        animated
      />
      <GeometricShape
        type="triangle"
        size={200}
        bottom="-100px"
        left="-100px"
        color="rgba(255, 109, 0, 0.05)"
        animated
      />
      <GeometricShape
        type="hexagon"
        size={150}
        top="30%"
        right="5%"
        color="rgba(142, 36, 170, 0.03)"
        animated
      />
      
      <div className="flex max-w-7xl mx-auto relative">
        {/* Mobile Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-18 sm:top-20 left-2 sm:left-4 z-50 glass-card-sm h-8 w-8 sm:h-9 sm:w-9"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>

        {/* Sidebar */}
        <aside className={`
          sidebar-gradient fixed md:static inset-y-0 left-0 z-40 w-56 sm:w-64 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-14 sm:pt-16 md:pt-0 border-r border-border/50
        `}>
          <div className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Answers</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono">{totalAnswers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono reward-success">{successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rewards</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono gradient-text">{totalRewards.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>Recent Rewards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 sm:p-4 pt-0">
                  {rewards.slice(0, 3).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No rewards yet</p>
                  ) : (
                    rewards.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-muted/30">
                        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                          {reward.reward_type}
                        </span>
                        <span className="text-xs font-mono reward-success ml-2 shrink-0">
                          {Number(reward.value).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => router.push('/contributor/questions')}
                variant="gradient"
                className="w-full glow-hover text-xs sm:text-sm"
                size="sm"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Browse Questions
              </Button>
            </motion.div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Diagonal Hero Section with Large Trust Score */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="diagonal-section relative w-full"
          >
            <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden w-full">
              <GeometricOverlay
                shapes={[
                  { type: 'circle', size: 200, top: '-100px', right: '-100px', color: 'rgba(142, 36, 170, 0.1)' },
                  { type: 'triangle', size: 150, bottom: '-75px', left: '-75px', color: 'rgba(255, 109, 0, 0.1)' },
                ]}
                className="absolute inset-0"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 relative z-10 w-full">
                <div className="flex flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2 break-words">
                      Welcome back, {profile.name || 'Contributor'}!
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                      Continue building your trust score and earning rewards
                    </p>
                    <Button
                      onClick={() => router.push('/contributor/questions')}
                      variant="gradient"
                      className="w-full sm:w-fit hover-3d text-sm sm:text-base"
                      size="default"
                    >
                      Browse Questions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
                <div className="flex items-center justify-center mt-4 md:mt-0">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="relative"
                  >
                    <GlassCard variant="gradient-border" blur="md" className="p-4 sm:p-6 md:p-8 hover-3d w-full max-w-[200px] sm:max-w-[240px] md:max-w-none mx-auto md:mx-0">
                      <div className="flex flex-col items-center w-full">
                        <RadialProgress
                          value={Number(profile.trust_score)}
                          max={100}
                          size={100}
                          strokeWidth={8}
                          className="sm:scale-110 md:scale-125"
                          color={Number(profile.trust_score) >= 70 ? 'success' : Number(profile.trust_score) >= 40 ? 'primary' : 'warning'}
                          glow={Number(profile.trust_score) >= 70}
                        />
                        <div className="mt-3 sm:mt-4 text-center w-full">
                          <p className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">{profile.trust_score?.toFixed(1)}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Trust Score</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Asymmetric Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stagger-item"
            >
              <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                <GeometricShape
                  type="hexagon"
                  size={60}
                  top="5px"
                  right="5px"
                  color="rgba(142, 36, 170, 0.1)"
                  position="absolute"
                  zIndex={0}
                />
                <GlassCardHeader>
                  <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">Answers Submitted</span>
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10">
                  <AnimatedStatCard
                    label="Total Answers"
                    value={totalAnswers}
                    icon={<MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />}
                  />
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <AnimatedCounter value={correctAnswers} /> correct ({successRate.toFixed(1)}%)
                    </p>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stagger-item"
            >
              <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                <GeometricShape
                  type="circle"
                  size={70}
                  bottom="-10px"
                  left="-10px"
                  color="rgba(255, 109, 0, 0.1)"
                  position="absolute"
                  zIndex={0}
                />
                <GlassCardHeader>
                  <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">Total Rewards</span>
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10">
                  <AnimatedStatCard
                    label="Points Earned"
                    value={totalRewards}
                    formatValue={(v) => v.toFixed(2)}
                    suffix=" pts"
                    icon={<Award className="h-3 w-3 sm:h-4 sm:w-4" />}
                  />
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="stagger-item"
            >
              <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                <GeometricShape
                  type="triangle"
                  size={65}
                  top="-15px"
                  right="-15px"
                  color="rgba(142, 36, 170, 0.1)"
                  position="absolute"
                  zIndex={0}
                />
                <GlassCardHeader>
                  <GlassCardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 relative z-10">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">Success Rate</span>
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="relative z-10">
                  <AnimatedStatCard
                    label="Accuracy"
                    value={successRate}
                    formatValue={(v) => v.toFixed(1)}
                    suffix="%"
                    icon={<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                  />
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          </div>

          {/* Large Answer History Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DataVisualizationCard
              title="Answer Performance"
              description="Your answer history and performance trends"
              gradient
              geometricOverlay
              className="w-full"
            >
              <ChartContainer height={250} className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255, 255, 255, 0.5)" 
                      tick={{ fontSize: 10 }}
                      className="text-xs sm:text-sm"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.5)" 
                      tick={{ fontSize: 10 }}
                      className="text-xs sm:text-sm"
                      width={30}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: 'rgba(255, 255, 255, 0.7)' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        padding: '8px',
                      }}
                      labelStyle={{ fontSize: '11px', marginBottom: '4px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                      iconType="line"
                      iconSize={12}
                    />
                    <Line
                      type="monotone"
                      dataKey="answers"
                      stroke="#8E24AA"
                      strokeWidth={2}
                      dot={{ fill: '#8E24AA', r: 3 }}
                      name="Total Answers"
                    />
                    <Line
                      type="monotone"
                      dataKey="correct"
                      stroke="#00E676"
                      strokeWidth={2}
                      dot={{ fill: '#00E676', r: 3 }}
                      name="Correct Answers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </DataVisualizationCard>
          </motion.div>

          {/* Recent Answers Table with Glassmorphic Rows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden">
              <GeometricOverlay
                shapes={[
                  { type: 'hexagon', size: 120, top: '20%', right: '5%', color: 'rgba(142, 36, 170, 0.05)' },
                ]}
                className="absolute inset-0"
              />
              <GlassCardHeader gradient>
                <GlassCardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>Recent Answers</span>
                </GlassCardTitle>
                <GlassCardDescription className="text-white/90 text-xs sm:text-sm">
                  Your latest contributions
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="relative z-10 p-2 sm:p-4 md:p-6">
                {recentAnswers.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">No answers yet. Start answering questions!</p>
                    <Button
                      onClick={() => router.push('/contributor/questions')}
                      variant="gradient"
                      className="hover-3d text-sm sm:text-base"
                      size="sm"
                    >
                      Browse Questions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Question</TableHead>
                          <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Answer</TableHead>
                          <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Consensus</TableHead>
                          <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Status</TableHead>
                          <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAnswers.map((answer, index) => (
                          <motion.tr
                            key={answer.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-white/5 glass-card-sm hover:glass-card-md transition-all cursor-pointer hover-3d-lift"
                          >
                            <TableCell className="max-w-[150px] sm:max-w-xs truncate text-xs sm:text-sm px-2 sm:px-4">
                              {answer.question_content || 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">
                              {answer.answer_text.substring(0, 50)}...
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                              <span className="font-mono text-xs">
                                {answer.consensus_score !== null ? `${answer.consensus_score.toFixed(1)}%` : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 sm:px-4">
                              {answer.correct === null ? (
                                <Badge className="status-pending text-xs">
                                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  <span className="hidden sm:inline">Pending</span>
                                </Badge>
                              ) : answer.correct ? (
                                <Badge className="status-correct text-xs">
                                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  <span className="hidden sm:inline">Correct</span>
                                </Badge>
                              ) : (
                                <Badge className="status-incorrect text-xs">
                                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  <span className="hidden sm:inline">Incorrect</span>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">
                              {new Date(answer.created_at).toLocaleDateString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
