'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from '@/components/ui/glass-card'
import { DataVisualizationCard, ChartContainer } from '@/components/ui/data-visualization-card'
import { GeometricShape, GeometricOverlay } from '@/components/ui/geometric-shape'
import { AnimatedCounter, AnimatedStatCard } from '@/components/ui/animated-counter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Particles } from '@/components/ui/Particles'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { motion } from 'framer-motion'
import { 
  Award, 
  Gift, 
  Coins, 
  Sparkles,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { getRewardTypeDisplayName, formatRewardValue } from '@/lib/utils/rewards'
import type { Reward, RewardType, RewardStatus } from '@/types/database'

export default function RewardsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadRewards()
    }
  }, [user, authLoading])

  const loadRewards = async () => {
    try {
      const response = await fetch(`/api/rewards/allocate?contributorId=${user!.id}`)
      const data = await response.json()
      if (data.success) {
        setRewards(data.rewards || [])
      }
    } catch (err: any) {
      console.error('Error loading rewards:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter rewards
  const filteredRewards = rewards.filter(reward => {
    if (statusFilter !== 'all' && reward.status !== statusFilter) return false
    if (typeFilter !== 'all' && reward.reward_type !== typeFilter) return false
    return true
  })

  // Calculate statistics
  const totalRewards = rewards.reduce((sum, r) => sum + Number(r.value), 0)
  const pendingRewards = rewards.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.value), 0)
  const awardedRewards = rewards.filter(r => r.status === 'awarded').reduce((sum, r) => sum + Number(r.value), 0)
  const redeemedRewards = rewards.filter(r => r.status === 'redeemed').reduce((sum, r) => sum + Number(r.value), 0)

  // Reward type distribution
  const typeDistribution = [
    { name: 'Airtime', value: rewards.filter(r => r.reward_type === 'airtime').length, color: '#8E24AA' },
    { name: 'Mobile Money', value: rewards.filter(r => r.reward_type === 'mobile_money').length, color: '#FF6D00' },
    { name: 'Grocery Voucher', value: rewards.filter(r => r.reward_type === 'grocery_voucher').length, color: '#00E676' },
  ]

  // Status distribution
  const statusDistribution = [
    { name: 'Pending', value: rewards.filter(r => r.status === 'pending').length, color: '#FFC107' },
    { name: 'Awarded', value: rewards.filter(r => r.status === 'awarded').length, color: '#00E676' },
    { name: 'Redeemed', value: rewards.filter(r => r.status === 'redeemed').length, color: '#5C6BC0' },
  ]

  // Monthly trend data
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthRewards = rewards.filter(r => {
      const rewardDate = new Date(r.awarded_at)
      return rewardDate.getMonth() === date.getMonth() && rewardDate.getFullYear() === date.getFullYear()
    })
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      value: monthRewards.reduce((sum, r) => sum + Number(r.value), 0),
      count: monthRewards.length,
    }
  })

  const handleRedeem = async (reward: Reward) => {
    setRedeeming(true)
    try {
      // In production, this would call the actual redemption API
      const { data, error } = await supabase
        .from('rewards')
        .update({ status: 'redeemed' })
        .eq('id', reward.id)
        .select()
        .single()

      if (error) throw error
      
      setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, status: 'redeemed' } : r))
      setShowRedeemDialog(false)
      setSelectedReward(null)
    } catch (err: any) {
      console.error('Error redeeming reward:', err)
      alert('Failed to redeem reward. Please try again.')
    } finally {
      setRedeeming(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading rewards...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden p-4 md:p-8">
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

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0" />
              <span className="break-words">My Rewards</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track and redeem your earned rewards</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={loadRewards} className="hover-3d flex-1 sm:flex-initial text-xs sm:text-sm" size="sm">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
            <Button variant="outline" className="hover-3d flex-1 sm:flex-initial text-xs sm:text-sm" size="sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[
            { label: 'Total Rewards', value: totalRewards, icon: Award, color: 'rgba(142, 36, 170, 0.1)' },
            { label: 'Pending', value: pendingRewards, icon: Clock, color: 'rgba(255, 193, 7, 0.1)' },
            { label: 'Awarded', value: awardedRewards, icon: CheckCircle2, color: 'rgba(0, 230, 118, 0.1)' },
            { label: 'Redeemed', value: redeemedRewards, icon: Coins, color: 'rgba(92, 107, 192, 0.1)' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <GlassCard variant="gradient-border" blur="md" floating hover className="hover-3d relative overflow-hidden">
                <GeometricShape
                  type={index % 2 === 0 ? 'circle' : 'hexagon'}
                  size={60}
                  top={index % 2 === 0 ? '5px' : '-20px'}
                  right={index % 2 === 0 ? '5px' : '-20px'}
                  color={stat.color}
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
                      formatValue={(v) => v.toFixed(2)}
                      suffix=" pts"
                      className="text-lg sm:text-xl md:text-2xl font-bold block"
                    />
                  </GlassCardContent>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DataVisualizationCard
              title="Reward Type Distribution"
              description="Breakdown by reward type"
              geometricOverlay
            >
              <ChartContainer height={250} className="sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <DataVisualizationCard
              title="Reward Trends"
              description="Monthly reward earnings"
              geometricOverlay
            >
              <ChartContainer height={250} className="sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="month" 
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
                    <Line type="monotone" dataKey="value" stroke="#8E24AA" strokeWidth={2} name="Value (pts)" />
                    <Line type="monotone" dataKey="count" stroke="#00E676" strokeWidth={2} name="Count" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </DataVisualizationCard>
          </motion.div>
        </div>

        {/* Filters */}
        <GlassCard variant="gradient-border" blur="md" className="relative overflow-hidden">
          <GeometricOverlay
            shapes={[
              { type: 'hexagon', size: 100, top: '10%', right: '5%', color: 'rgba(142, 36, 170, 0.05)' },
            ]}
            className="absolute inset-0"
          />
          <GlassCardHeader className="p-3 sm:p-4">
            <GlassCardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 relative z-10">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Filters</span>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="relative z-10 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="status-filter" className="text-xs sm:text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="awarded">Awarded</SelectItem>
                    <SelectItem value="redeemed">Redeemed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter" className="text-xs sm:text-sm">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" className="text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="airtime">Airtime</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="grocery_voucher">Grocery Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
                <Input
                  id="search"
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Rewards Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard variant="gradient-border" blur="lg" className="relative overflow-hidden">
            <GeometricOverlay
              shapes={[
                { type: 'triangle', size: 120, bottom: '5%', left: '5%', color: 'rgba(255, 109, 0, 0.05)' },
              ]}
              className="absolute inset-0"
            />
            <GlassCardHeader gradient className="p-3 sm:p-4">
              <div className="flex justify-between items-center relative z-10">
                <div className="min-w-0 flex-1">
                  <GlassCardTitle className="text-white text-sm sm:text-base">All Rewards</GlassCardTitle>
                  <GlassCardDescription className="text-white/90 text-xs sm:text-sm">
                    {filteredRewards.length} reward{filteredRewards.length !== 1 ? 's' : ''} found
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="relative z-10 p-2 sm:p-4 md:p-6">
              {filteredRewards.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">No rewards found</p>
                  <Button
                    onClick={() => router.push('/contributor/questions')}
                    variant="gradient"
                    className="hover-3d text-sm sm:text-base"
                    size="sm"
                  >
                    Start Answering Questions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Type</TableHead>
                        <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Value</TableHead>
                        <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4">Status</TableHead>
                        <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-white/90 text-xs sm:text-sm px-2 sm:px-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRewards.map((reward, index) => {
                        const statusConfig: Record<RewardStatus, { color: string; bg: string; icon: any }> = {
                          pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Clock },
                          awarded: { color: 'text-green-500', bg: 'bg-green-500/20 border-green-500/30', icon: CheckCircle2 },
                          redeemed: { color: 'text-blue-500', bg: 'bg-blue-500/20 border-blue-500/30', icon: Coins },
                        }
                        const config = statusConfig[reward.status]
                        const StatusIcon = config.icon

                        return (
                          <motion.tr
                            key={reward.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-white/5 glass-card-sm hover:glass-card-md transition-all cursor-pointer hover-3d-lift"
                          >
                            <TableCell className="px-2 sm:px-4">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                {reward.reward_type === 'airtime' && <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 shrink-0" />}
                                {reward.reward_type === 'mobile_money' && <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />}
                                {reward.reward_type === 'grocery_voucher' && <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />}
                                <span className="font-medium text-xs sm:text-sm truncate">{getRewardTypeDisplayName(reward.reward_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <span className="font-mono font-bold gradient-text text-xs sm:text-sm">
                                {formatRewardValue(Number(reward.value), reward.reward_type)}
                              </span>
                            </TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <Badge className={`${config.bg} ${config.color} border flex items-center gap-1 w-fit text-xs`}>
                                <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span className="hidden sm:inline">{reward.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">
                              {new Date(reward.awarded_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right px-2 sm:px-4">
                              {reward.status === 'awarded' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReward(reward)
                                    setShowRedeemDialog(true)
                                  }}
                                  className="hover-3d-lift text-xs sm:text-sm h-7 sm:h-8"
                                >
                                  Redeem
                                </Button>
                              )}
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </motion.div>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="glass-card-lg">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Confirm redemption of your reward
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg glass-card-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Reward Type</span>
                  <span className="font-medium">{getRewardTypeDisplayName(selectedReward.reward_type)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="font-bold font-mono gradient-text">
                    {formatRewardValue(Number(selectedReward.value), selectedReward.reward_type)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Awarded</span>
                  <span className="text-sm">
                    {new Date(selectedReward.awarded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={redeeming}
                  variant="gradient"
                  className="hover-3d"
                >
                  {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

