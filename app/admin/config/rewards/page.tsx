'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Edit2, X, Check, RefreshCw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RewardRule {
  id: string
  question_type: string
  base_reward_per_question: number
  task_type_multipliers: Record<string, number>
  country_multipliers: Record<string, number>
  min_reward: number
  max_reward: number
  currency: string
  is_active: boolean
}

export default function GlobalRewardsConfigPage() {
  const [rules, setRules] = useState<RewardRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRewardRules()
  }, [])

  const loadRewardRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/rewards')
      const data = await response.json()
      if (data.success) {
        setRules(data.rules || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to load reward rules')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reward rules')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: RewardRule) => {
    setEditing({
      ...editing,
      [rule.id]: {
        base_reward_per_question: rule.base_reward_per_question,
        task_type_multipliers: JSON.stringify(rule.task_type_multipliers || {}, null, 2),
        country_multipliers: JSON.stringify(rule.country_multipliers || {}, null, 2),
        min_reward: rule.min_reward,
        max_reward: rule.max_reward,
        is_active: rule.is_active,
      },
    })
  }

  const handleSave = async (ruleId: string) => {
    setSaving(ruleId)
    try {
      const edited = editing[ruleId]
      const response = await fetch('/api/admin/config/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          base_reward_per_question: parseFloat(edited.base_reward_per_question),
          task_type_multipliers: JSON.parse(edited.task_type_multipliers),
          country_multipliers: JSON.parse(edited.country_multipliers),
          min_reward: parseFloat(edited.min_reward),
          max_reward: parseFloat(edited.max_reward),
          is_active: edited.is_active,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newEditing = { ...editing }
        delete newEditing[ruleId]
        setEditing(newEditing)
        await loadRewardRules()
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading reward rules...</div>
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Global Reward Configuration</h1>
              <p className="text-muted-foreground">Configure reward rules for all campaigns</p>
            </div>
            <Button onClick={loadRewardRules} variant="outline" className="hover-3d">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </motion.div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <GlassPanel title="Reward Rules" description="Manage global reward settings" geometricOverlay>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No reward rules found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question Type</TableHead>
                    <TableHead>Base Reward</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const isEditing = editing[rule.id]
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium capitalize">{rule.question_type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={isEditing.base_reward_per_question}
                              onChange={(e) => setEditing({ ...editing, [rule.id]: { ...isEditing, base_reward_per_question: e.target.value } })}
                              className="w-24"
                            />
                          ) : (
                            `${rule.currency} ${rule.base_reward_per_question.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input type="number" step="0.01" value={isEditing.min_reward} onChange={(e) => setEditing({ ...editing, [rule.id]: { ...isEditing, min_reward: e.target.value } })} className="w-20" placeholder="Min" />
                              <Input type="number" step="0.01" value={isEditing.max_reward} onChange={(e) => setEditing({ ...editing, [rule.id]: { ...isEditing, max_reward: e.target.value } })} className="w-20" placeholder="Max" />
                            </div>
                          ) : (
                            `${rule.currency} ${rule.min_reward.toFixed(2)} - ${rule.max_reward.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'outline'}>{rule.is_active ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSave(rule.id)} disabled={saving === rule.id}>
                                {saving === rule.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { const newEditing = { ...editing }; delete newEditing[rule.id]; setEditing(newEditing); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleEdit(rule)} className="hover-3d">
                              <Edit2 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}



