'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit2, X, Check, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface LanguageConfig {
  id: string
  language_code: string
  language_name: string
  native_name: string | null
  is_supported: boolean
  is_rtl: boolean
  default_currency: string | null
  cost_multiplier: number
  reward_multiplier: number
}

export default function LanguagesConfigPage() {
  const [languages, setLanguages] = useState<LanguageConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadLanguages()
  }, [])

  const loadLanguages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/languages')
      const data = await response.json()
      if (data.success) {
        setLanguages(data.languages || [])
      }
    } catch (err) {
      console.error('Error loading languages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lang: LanguageConfig) => {
    setEditing({
      ...editing,
      [lang.id]: {
        is_supported: lang.is_supported,
        default_currency: lang.default_currency || '',
        cost_multiplier: lang.cost_multiplier,
        reward_multiplier: lang.reward_multiplier,
      },
    })
  }

  const handleSave = async (langId: string) => {
    setSaving(langId)
    try {
      const edited = editing[langId]
      const response = await fetch('/api/admin/config/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: langId,
          is_supported: edited.is_supported,
          default_currency: edited.default_currency || null,
          cost_multiplier: parseFloat(edited.cost_multiplier),
          reward_multiplier: parseFloat(edited.reward_multiplier),
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newEditing = { ...editing }
        delete newEditing[langId]
        setEditing(newEditing)
        await loadLanguages()
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
          <h1 className="text-3xl font-bold mb-2 gradient-text">Language Configuration</h1>
          <p className="text-muted-foreground">Manage supported languages and language-specific settings</p>
        </motion.div>

        <GlassPanel title="Languages" geometricOverlay>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Supported</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Cost Mult.</TableHead>
                <TableHead>Reward Mult.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((lang) => {
                const isEditing = editing[lang.id]
                return (
                  <TableRow key={lang.id}>
                    <TableCell className="font-medium">{lang.language_name}</TableCell>
                    <TableCell>{lang.language_code}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Checkbox checked={isEditing.is_supported} onCheckedChange={(checked) => setEditing({ ...editing, [lang.id]: { ...isEditing, is_supported: checked === true } })} />
                      ) : (
                        <Badge variant={lang.is_supported ? 'default' : 'outline'}>{lang.is_supported ? 'Yes' : 'No'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select value={isEditing.default_currency || ''} onValueChange={(value) => setEditing({ ...editing, [lang.id]: { ...isEditing, default_currency: value } })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ZAR">ZAR</SelectItem>
                            <SelectItem value="KES">KES</SelectItem>
                            <SelectItem value="NGN">NGN</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        lang.default_currency || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.1" value={isEditing.cost_multiplier} onChange={(e) => setEditing({ ...editing, [lang.id]: { ...isEditing, cost_multiplier: e.target.value } })} className="w-24" />
                      ) : (
                        lang.cost_multiplier.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="number" step="0.1" value={isEditing.reward_multiplier} onChange={(e) => setEditing({ ...editing, [lang.id]: { ...isEditing, reward_multiplier: e.target.value } })} className="w-24" />
                      ) : (
                        lang.reward_multiplier.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(lang.id)} disabled={saving === lang.id}>
                            {saving === lang.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { const newEditing = { ...editing }; delete newEditing[lang.id]; setEditing(newEditing); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(lang)} className="hover-3d">
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



