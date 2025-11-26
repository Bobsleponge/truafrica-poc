'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Edit2, X, Check, RefreshCw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import type { PricingRule } from '@/types/database'

export default function GlobalPricingConfigPage() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPricingRules()
  }, [])

  const loadPricingRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/pricing')
      const data = await response.json()

      if (data.success) {
        setRules(data.rules || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to load pricing rules')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing rules')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: PricingRule) => {
    setEditing({
      ...editing,
      [rule.id]: {
        base_price_per_answer: rule.base_price_per_answer,
        base_cost_per_answer: rule.base_cost_per_answer,
        multiplier_factors: JSON.stringify(rule.multiplier_factors || {}, null, 2),
        is_active: rule.is_active,
      },
    })
  }

  const handleCancel = (ruleId: string) => {
    const newEditing = { ...editing }
    delete newEditing[ruleId]
    setEditing(newEditing)
  }

  const handleSave = async (ruleId: string) => {
    setSaving(ruleId)
    try {
      const edited = editing[ruleId]
      let multiplierFactors

      try {
        multiplierFactors = JSON.parse(edited.multiplier_factors)
      } catch (e) {
        throw new Error('Invalid JSON in multiplier factors')
      }

      const response = await fetch('/api/admin/config/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          base_price_per_answer: parseFloat(edited.base_price_per_answer),
          base_cost_per_answer: parseFloat(edited.base_cost_per_answer),
          multiplier_factors: multiplierFactors,
          is_active: edited.is_active,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const newEditing = { ...editing }
        delete newEditing[ruleId]
        setEditing(newEditing)
        await loadPricingRules()
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to save pricing rule')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save pricing rule')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading pricing rules...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Global Pricing Configuration</h1>
              <p className="text-muted-foreground">
                Configure base prices, costs, and multipliers for all question types
              </p>
            </div>
            <Button onClick={loadPricingRules} variant="outline" className="hover-3d">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <GlassPanel
          title="Pricing Rules"
          description="Manage pricing rules that affect all campaigns"
          geometricOverlay
        >
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pricing rules found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question Type</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Base Cost</TableHead>
                    <TableHead>Multipliers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const isEditing = editing[rule.id]
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium capitalize">
                          {rule.question_type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={isEditing.base_price_per_answer}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  [rule.id]: {
                                    ...isEditing,
                                    base_price_per_answer: e.target.value,
                                  },
                                })
                              }
                              className="w-24"
                            />
                          ) : (
                            `$${rule.base_price_per_answer.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={isEditing.base_cost_per_answer}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  [rule.id]: {
                                    ...isEditing,
                                    base_cost_per_answer: e.target.value,
                                  },
                                })
                              }
                              className="w-24"
                            />
                          ) : (
                            `$${rule.base_cost_per_answer.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Textarea
                              value={isEditing.multiplier_factors}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  [rule.id]: {
                                    ...isEditing,
                                    multiplier_factors: e.target.value,
                                  },
                                })
                              }
                              className="w-64 h-24 font-mono text-xs"
                              placeholder='{"complexity": {"easy": 1.0, "medium": 1.3, "hard": 1.6}}'
                            />
                          ) : (
                            <pre className="text-xs text-muted-foreground max-w-xs overflow-x-auto">
                              {JSON.stringify(rule.multiplier_factors || {}, null, 2)}
                            </pre>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'outline'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSave(rule.id)}
                                disabled={saving === rule.id}
                                className="hover-3d"
                              >
                                {saving === rule.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(rule.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(rule)}
                              className="hover-3d"
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
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



