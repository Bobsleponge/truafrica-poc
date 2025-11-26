'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function InHouseCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/in-house-campaigns')
      const result = await response.json()
      if (result.success) {
        setCampaigns(result.campaigns)
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">In-House Campaigns</h1>
            <p className="text-muted-foreground">
              Manage platform growth campaigns (translations, onboarding, feedback)
            </p>
          </div>
          <Link href="/admin/in-house-campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{campaign.type}</CardTitle>
                  <Badge variant={campaign.status === 'running' ? 'default' : 'outline'}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {campaign.target_language && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Target Language: {campaign.target_language}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mb-4">
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </div>
                {campaign.campaign_id && (
                  <Link href={`/client/campaigns/${campaign.campaign_id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Campaign
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No in-house campaigns yet</p>
              <Link href="/admin/in-house-campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

