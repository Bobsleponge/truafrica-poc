'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface QuestionTemplate {
  id: string
  sector: string
  question_type: string
  content: string
  options: string[]
  metadata: Record<string, any>
  is_internal: boolean
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [template, setTemplate] = useState<QuestionTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    sector: '',
    question_type: '',
    content: '',
    options: '',
    is_internal: false,
  })

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const resolvedParams = await params
      const isNew = resolvedParams.id === 'new'
      
      if (isNew) {
        setTemplate(null)
        setFormData({
          sector: '',
          question_type: '',
          content: '',
          options: '',
          is_internal: false,
        })
      } else {
        const response = await fetch(`/api/admin/templates/${resolvedParams.id}`)
        const data = await response.json()
        if (data.success && data.template) {
          setTemplate(data.template)
          setFormData({
            sector: data.template.sector,
            question_type: data.template.question_type,
            content: data.template.content,
            options: JSON.stringify(data.template.options || [], null, 2),
            is_internal: data.template.is_internal,
          })
        }
      }
    } catch (err) {
      console.error('Error loading template:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const resolvedParams = await params
      const isNew = resolvedParams.id === 'new'
      
      let options
      try {
        options = JSON.parse(formData.options)
      } catch {
        options = formData.options.split('\n').filter(Boolean)
      }

      const url = isNew ? '/api/admin/templates' : `/api/admin/templates/${resolvedParams.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: formData.sector,
          question_type: formData.question_type,
          content: formData.content,
          options,
          is_internal: formData.is_internal,
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/templates')
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err: any) {
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const resolvedParams = await params
      const response = await fetch(`/api/admin/templates/${resolvedParams.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        router.push('/admin/templates')
      } else {
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">
                {template ? 'Edit Template' : 'New Template'}
              </h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/templates')} className="hover-3d">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </motion.div>

        <GlassPanel title="Template Details" geometricOverlay>
          <div className="space-y-6">
            <div>
              <Label>Sector</Label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Climate">Climate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Question Type</Label>
              <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_text">Open Text</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image_classification">Image Classification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="mt-2 min-h-[100px]"
                placeholder="Enter question content..."
              />
            </div>

            <div>
              <Label>Options (JSON array or one per line)</Label>
              <Textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                className="mt-2 min-h-[100px] font-mono text-sm"
                placeholder='["Option 1", "Option 2"] or one option per line'
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.is_internal}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_internal: checked === true })}
                />
                <Label>Internal Template (only visible to admins)</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="hover-3d">
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Template
              </Button>
              {template && (
                <Button variant="destructive" onClick={handleDelete} className="hover-3d">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}



