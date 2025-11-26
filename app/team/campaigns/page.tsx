'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, FolderKanban, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Campaign } from '@/types/database'

export default function TeamCampaignsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadCampaigns()
    }
  }, [user, authLoading])

  const loadCampaigns = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user!.id)
        .single()

      if (userData?.role !== 'team_account') {
        router.push('/')
        return
      }

      const response = await fetch('/api/team/campaigns')
      const campaignsData = await response.json()
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || [])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Link href="/team/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold gradient-text mb-2">All Campaigns</h1>
        <p className="text-muted-foreground">View all campaigns across all clients</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Link key={campaign.id} href={`/team/campaigns/${campaign.id}`}>
            <GlassCard className="hover:border-primary/50 transition-colors cursor-pointer">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    {campaign.name}
                  </GlassCardTitle>
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
                <div className="mt-2 flex items-center gap-2">
                  {campaign.target_countries && campaign.target_countries.length > 0 && (
                    <Badge variant="outline">
                      {campaign.target_countries.length} countries
                    </Badge>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No campaigns found</p>
      )}
    </div>
  )
}



