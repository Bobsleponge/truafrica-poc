'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit2, X, Check, RefreshCw, Download, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

interface CostOfLivingMultiplier {
  id: string
  country_code: string
  country_name: string
  currency: string
  multiplier: number
  notes: string | null
}

export default function CostOfLivingConfigPage() {
  const [multipliers, setMultipliers] = useState<CostOfLivingMultiplier[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadMultipliers()
  }, [])

  const loadMultipliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/cost-of-living')
      const data = await response.json()
      if (data.success) {
        setMultipliers(data.multipliers || [])
      }
    } catch (err) {
      console.error('Error loading multipliers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (multiplier: CostOfLivingMultiplier) => {
    setEditing({
      ...editing,
      [multiplier.id]: {
        multiplier: multiplier.multiplier,
        notes: multiplier.notes || '',
      },
    })
  }

  const handleSave = async (id: string) => {
    setSaving(id)
    try {
      const edited = editing[id]
      const response = await fetch('/api/admin/config/cost-of-living', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          multiplier: parseFloat(edited.multiplier),
          notes: edited.notes,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newEditing = { ...editing }
        delete newEditing[id]
        setEditing(newEditing)
        await loadMultipliers()
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Cost of Living Multipliers</h1>
              <p className="text-muted-foreground">Configure per-country cost of living adjustments</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="hover-3d">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button variant="outline" className="hover-3d">
                <Upload className="h-4 w-4 mr-2" /> Import
              </Button>
              <Button variant="outline" onClick={loadMultipliers} className="hover-3d">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        <GlassPanel title="Country Multipliers" geometricOverlay>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multipliers.map((mult) => {
                const isEditing = editing[mult.id]
                return (
                  <TableRow key={mult.id}>
                    <TableCell className="font-medium">{mult.country_name}</TableCell>
                    <TableCell>{mult.country_code}</TableCell>
                    <TableCell>{mult.currency}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.0001" value={isEditing.multiplier} onChange={(e) => setEditing({ ...editing, [mult.id]: { ...isEditing, multiplier: e.target.value } })} className="w-32" />
                      ) : (
                        mult.multiplier.toFixed(4)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={isEditing.notes} onChange={(e) => setEditing({ ...editing, [mult.id]: { ...isEditing, notes: e.target.value } })} className="w-48" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{mult.notes || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(mult.id)} disabled={saving === mult.id}>
                            {saving === mult.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { const newEditing = { ...editing }; delete newEditing[mult.id]; setEditing(newEditing); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(mult)} className="hover-3d">
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



