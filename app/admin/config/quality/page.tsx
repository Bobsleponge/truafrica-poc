'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface QualityConfig {
  id: string
  minimum_quality_score: number
  duplicate_detection_level: string
  geo_verification_enabled: boolean
  geo_verification_strictness: string
  ai_validation_strictness: string
  ai_confidence_threshold: number
  human_review_threshold: number
}

export default function QualityConfigPage() {
  const [config, setConfig] = useState<QualityConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    minimum_quality_score: 70.0,
    duplicate_detection_level: 'standard',
    geo_verification_enabled: true,
    geo_verification_strictness: 'standard',
    ai_validation_strictness: 'standard',
    ai_confidence_threshold: 0.80,
    human_review_threshold: 0.60,
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/quality')
      const data = await response.json()
      if (data.success && data.config) {
        setConfig(data.config)
        setFormData({
          minimum_quality_score: data.config.minimum_quality_score,
          duplicate_detection_level: data.config.duplicate_detection_level,
          geo_verification_enabled: data.config.geo_verification_enabled,
          geo_verification_strictness: data.config.geo_verification_strictness,
          ai_validation_strictness: data.config.ai_validation_strictness,
          ai_confidence_threshold: data.config.ai_confidence_threshold,
          human_review_threshold: data.config.human_review_threshold,
        })
      }
    } catch (err) {
      console.error('Error loading quality config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/config/quality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        await loadConfig()
        alert('Quality configuration saved successfully')
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err: any) {
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 gradient-text">Quality Configuration</h1>
          <p className="text-muted-foreground">Configure global quality control settings</p>
        </motion.div>

        <GlassPanel title="Quality Settings" geometricOverlay>
          <div className="space-y-6">
            <div>
              <Label>Minimum Quality Score</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.minimum_quality_score}
                onChange={(e) => setFormData({ ...formData, minimum_quality_score: parseFloat(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum score required for answers (0-100)</p>
            </div>

            <div>
              <Label>Duplicate Detection Level</Label>
              <Select value={formData.duplicate_detection_level} onValueChange={(value) => setFormData({ ...formData, duplicate_detection_level: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="lenient">Lenient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  checked={formData.geo_verification_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, geo_verification_enabled: checked === true })}
                />
                <Label>Enable Geo-Verification</Label>
              </div>
              {formData.geo_verification_enabled && (
                <Select value={formData.geo_verification_strictness} onValueChange={(value) => setFormData({ ...formData, geo_verification_strictness: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="lenient">Lenient</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>AI Validation Strictness</Label>
              <Select value={formData.ai_validation_strictness} onValueChange={(value) => setFormData({ ...formData, ai_validation_strictness: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="lenient">Lenient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>AI Confidence Threshold</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.ai_confidence_threshold}
                onChange={(e) => setFormData({ ...formData, ai_confidence_threshold: parseFloat(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum AI confidence (0.0-1.0)</p>
            </div>

            <div>
              <Label>Human Review Threshold</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.human_review_threshold}
                onChange={(e) => setFormData({ ...formData, human_review_threshold: parseFloat(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Below this threshold, require human review (0.0-1.0)</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="hover-3d">
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Configuration
              </Button>
              <Button variant="outline" onClick={loadConfig}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}



