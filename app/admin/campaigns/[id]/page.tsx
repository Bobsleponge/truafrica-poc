'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { ActionButtons } from '@/components/admin/ActionButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Lock, Flag, Copy, Archive, Calculator, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    loadCampaign()
  }, [])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const resolvedParams = await params
      const response = await fetch(`/api/admin/campaigns/${resolvedParams.id}`)
      const data = await response.json()
      if (data.success && data.campaign) {
        setCampaign(data.campaign)
        setFormData({
          name: data.campaign.name || '',
          description: data.campaign.description || '',
          status: data.campaign.status || 'draft',
          approval_status: data.campaign.approval_status || 'draft',
          total_budget: data.campaign.total_budget || 0,
          reward_budget: data.campaign.reward_budget || 0,
          needs_review: data.campaign.needs_review || false,
          needs_question_design: data.campaign.needs_question_design || false,
        })
      }
    } catch (err) {
      console.error('Error loading campaign:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/admin/campaigns/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        await loadCampaign()
        alert('Campaign updated successfully')
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err: any) {
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (action: string) => {
    const resolvedParams = await params
    try {
      let endpoint = ''
      let body: any = {}

      switch (action) {
        case 'recalculate-pricing':
          endpoint = 'recalculate-pricing'
          break
        case 'lock':
          endpoint = 'lock'
          body = { locked: !campaign?.is_locked }
          break
        case 'flag':
          endpoint = 'flag'
          body = { flag: !campaign?.needs_review }
          break
        case 'duplicate':
          endpoint = 'duplicate'
          break
        case 'archive':
          endpoint = 'archive'
          break
      }

      const response = await fetch(`/api/admin/campaigns/${resolvedParams.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (data.success) {
        if (action === 'duplicate') {
          router.push(`/admin/campaigns/${data.campaign.id}`)
        } else {
          await loadCampaign()
          alert(data.message || 'Action completed successfully')
        }
      } else {
        throw new Error(data.error || 'Action failed')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading campaign...</div>
  if (!campaign) return <div className="p-8 text-muted-foreground">Campaign not found</div>

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">{campaign.name}</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant={campaign.status === 'running' ? 'default' : 'outline'}>{campaign.status}</Badge>
                {campaign.needs_review && <Badge variant="destructive">Needs Review</Badge>}
                {campaign.is_locked && <Badge variant="secondary">Locked</Badge>}
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/campaigns')} className="hover-3d">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </motion.div>

        <ActionButtons
          actions={[
            { label: 'Recalculate Pricing', icon: Calculator, onClick: () => handleAction('recalculate-pricing') },
            { label: campaign?.is_locked ? 'Unlock' : 'Lock', icon: Lock, onClick: () => handleAction('lock') },
            { label: campaign?.needs_review ? 'Remove Flag' : 'Flag for Review', icon: Flag, onClick: () => handleAction('flag') },
            { label: 'Duplicate', icon: Copy, onClick: () => handleAction('duplicate') },
            { label: 'Archive', icon: Archive, onClick: () => handleAction('archive'), variant: 'outline' },
          ]}
        />

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <GlassPanel title="Campaign Details" geometricOverlay>
              <div className="space-y-6">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Approval Status</Label>
                    <Select value={formData.approval_status} onValueChange={(value) => setFormData({ ...formData, approval_status: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="internal_review">Internal Review</SelectItem>
                        <SelectItem value="client_review">Client Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.needs_review}
                      onCheckedChange={(checked) => setFormData({ ...formData, needs_review: checked === true })}
                    />
                    <Label>Needs Review</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.needs_question_design}
                      onCheckedChange={(checked) => setFormData({ ...formData, needs_question_design: checked === true })}
                    />
                    <Label>Needs Question Design</Label>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="hover-3d">
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </GlassPanel>
          </TabsContent>

          <TabsContent value="pricing">
            <GlassPanel title="Pricing & Budget" geometricOverlay>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Budget</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total_budget}
                      onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Reward Budget</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.reward_budget}
                      onChange={(e) => setFormData({ ...formData, reward_budget: parseFloat(e.target.value) || 0 })}
                      className="mt-2"
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="hover-3d">
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Pricing
                </Button>
              </div>
            </GlassPanel>
          </TabsContent>

          <TabsContent value="questions">
            <GlassPanel title="Questions" geometricOverlay>
              {campaign.campaign_questions && campaign.campaign_questions.length > 0 ? (
                <div className="space-y-4">
                  {campaign.campaign_questions.map((cq: any, index: number) => (
                    <div key={cq.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <p className="text-sm text-muted-foreground">{cq.questions?.content || 'N/A'}</p>
                        </div>
                        <Badge variant="outline">{cq.question_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No questions found</div>
              )}
            </GlassPanel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



