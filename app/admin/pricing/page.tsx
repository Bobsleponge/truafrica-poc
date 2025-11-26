'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save } from 'lucide-react'
import type { PricingRule, QuestionType } from '@/types/database'

export default function AdminPricingPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadPricingRules()
    }
  }, [user, authLoading])

  const loadPricingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('question_type')

      if (error) throw error
      setPricingRules(data || [])
    } catch (err: any) {
      console.error('Error loading pricing rules:', err)
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
        multiplier_factors: JSON.stringify(rule.multiplier_factors, null, 2),
        is_active: rule.is_active,
      },
    })
  }

  const handleSave = async (ruleId: string) => {
    setSaving(ruleId)
    try {
      const edited = editing[ruleId]
      const multiplierFactors = JSON.parse(edited.multiplier_factors)

      const { error } = await supabase
        .from('pricing_rules')
        .update({
          base_price_per_answer: parseFloat(edited.base_price_per_answer),
          base_cost_per_answer: parseFloat(edited.base_cost_per_answer),
          multiplier_factors: multiplierFactors,
          is_active: edited.is_active,
        })
        .eq('id', ruleId)

      if (error) throw error

      const newEditing = { ...editing }
      delete newEditing[ruleId]
      setEditing(newEditing)
      loadPricingRules()
    } catch (err: any) {
      console.error('Error saving pricing rule:', err)
      alert('Failed to save pricing rule: ' + err.message)
    } finally {
      setSaving(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Pricing Rules</h1>
          <p className="text-muted-foreground">
            Manage pricing rules for different question types
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Pricing Configuration</CardTitle>
            <CardDescription>
              Configure base prices, costs, and multipliers for each question type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricingRules.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No pricing rules found. Default rules will be used.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question Type</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Base Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => {
                    const isEditing = editing[rule.id]
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium capitalize">
                          {rule.question_type.replace('_', ' ')}
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
                          <Badge variant={rule.is_active ? 'default' : 'outline'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={() => handleSave(rule.id)}
                              disabled={saving === rule.id}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {saving === rule.id ? 'Saving...' : 'Save'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




