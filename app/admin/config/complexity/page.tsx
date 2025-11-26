'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit2, X, Check, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComplexityConfig {
  id: string
  difficulty_level: string
  multiplier_value: number
  ai_assistance_threshold: number | null
  description: string | null
  is_active: boolean
}

export default function ComplexityConfigPage() {
  const [configs, setConfigs] = useState<ComplexityConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/complexity')
      const data = await response.json()
      if (data.success) {
        setConfigs(data.configs || [])
      }
    } catch (err) {
      console.error('Error loading complexity configs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: ComplexityConfig) => {
    setEditing({
      ...editing,
      [config.id]: {
        multiplier_value: config.multiplier_value,
        ai_assistance_threshold: config.ai_assistance_threshold || '',
        description: config.description || '',
        is_active: config.is_active,
      },
    })
  }

  const handleSave = async (configId: string) => {
    setSaving(configId)
    try {
      const edited = editing[configId]
      const response = await fetch('/api/admin/config/complexity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: configId,
          multiplier_value: parseFloat(edited.multiplier_value),
          ai_assistance_threshold: edited.ai_assistance_threshold ? parseFloat(edited.ai_assistance_threshold) : null,
          description: edited.description,
          is_active: edited.is_active,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newEditing = { ...editing }
        delete newEditing[configId]
        setEditing(newEditing)
        await loadConfigs()
      }
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 gradient-text">Complexity Configuration</h1>
          <p className="text-muted-foreground">Manage complexity multipliers and AI assistance thresholds</p>
        </motion.div>

        <GlassPanel title="Complexity Levels" geometricOverlay>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Difficulty Level</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>AI Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => {
                const isEditing = editing[config.id]
                return (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium capitalize">{config.difficulty_level}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.1" value={isEditing.multiplier_value} onChange={(e) => setEditing({ ...editing, [config.id]: { ...isEditing, multiplier_value: e.target.value } })} className="w-24" />
                      ) : (
                        config.multiplier_value.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.1" value={isEditing.ai_assistance_threshold} onChange={(e) => setEditing({ ...editing, [config.id]: { ...isEditing, ai_assistance_threshold: e.target.value } })} className="w-24" />
                      ) : (
                        config.ai_assistance_threshold?.toFixed(2) || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.is_active ? 'default' : 'outline'}>{config.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(config.id)} disabled={saving === config.id}>
                            {saving === config.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { const newEditing = { ...editing }; delete newEditing[config.id]; setEditing(newEditing); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(config)} className="hover-3d">
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </GlassPanel>
      </div>
    </div>
  )
}



