'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Search, Building2, FolderKanban, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { User, Campaign, Client } from '@/types/database'

export default function TeamDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    totalCampaigns: 0,
    runningCampaigns: 0,
    activeUsers: 0,
  })

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
      if (userData.role !== 'team_account') {
        router.push('/')
        return
      }
      setProfile(userData)

      // Load all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (!clientsError && clientsData) {
        setClients(clientsData as Client[])
        setStats(prev => ({ ...prev, totalClients: clientsData.length }))
      }

      // Load all campaigns
      const response = await fetch('/api/team/campaigns')
      const campaignsData = await response.json()
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || [])
        const totalCampaigns = campaignsData.campaigns?.length || 0
        const runningCampaigns = campaignsData.campaigns?.filter((c: Campaign) => c.status === 'running').length || 0
        setStats(prev => ({
          ...prev,
          totalCampaigns,
          runningCampaigns,
        }))
      }

      // Count active users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['client_owner', 'client_user', 'contributor'])
      
      setStats(prev => ({ ...prev, activeUsers: userCount || 0 }))
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Team Dashboard</h1>
          <p className="text-muted-foreground">Global view of all clients and campaigns</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Total Clients
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold gradient-text">{stats.totalClients}</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Total Campaigns
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold gradient-text">{stats.totalCampaigns}</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Running Campaigns
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold gradient-text">{stats.runningCampaigns}</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold gradient-text">{stats.activeUsers}</div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients or campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clients</CardTitle>
                <CardDescription>All client organizations</CardDescription>
              </div>
              <Link href="/team/clients">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.slice(0, 6).map((client) => (
                <Link key={client.id} href={`/team/clients/${client.id}`}>
                  <GlassCard className="hover:border-primary/50 transition-colors cursor-pointer">
                    <GlassCardHeader>
                      <GlassCardTitle className="text-lg">{client.name}</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          {client.industry && (
                            <Badge variant="outline">{client.industry}</Badge>
                          )}
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </Link>
              ))}
            </div>
            {filteredClients.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No clients found</p>
            )}
          </CardContent>
        </Card>

        {/* Campaigns Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>All campaigns across all clients</CardDescription>
              </div>
              <Link href="/team/campaigns">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCampaigns.slice(0, 10).map((campaign) => (
                <Link key={campaign.id} href={`/team/campaigns/${campaign.id}`}>
                  <GlassCard className="hover:border-primary/50 transition-colors cursor-pointer">
                    <GlassCardHeader>
                      <div className="flex items-center justify-between">
                        <GlassCardTitle className="text-lg">{campaign.name}</GlassCardTitle>
                        <Badge variant={
                          campaign.status === 'running' ? 'default' :
                          campaign.status === 'completed' ? 'secondary' :
                          'outline'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description || 'No description'}
                      </p>
                    </GlassCardContent>
                  </GlassCard>
                </Link>
              ))}
            </div>
            {filteredCampaigns.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No campaigns found</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}



