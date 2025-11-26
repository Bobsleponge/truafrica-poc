'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface QuestionTemplate {
  id: string
  sector: string
  question_type: string
  content: string
  options: string[]
  metadata: Record<string, any>
  is_internal: boolean
  created_at: string
  updated_at: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<QuestionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string>('all')
  const [internalFilter, setInternalFilter] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [sectorFilter, internalFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (sectorFilter !== 'all') params.append('sector', sectorFilter)
      if (internalFilter !== 'all') params.append('is_internal', internalFilter)

      const response = await fetch(`/api/admin/templates?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadTemplates()
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      alert('Failed to delete template')
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading templates...</div>

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Question Templates</h1>
              <p className="text-muted-foreground">Manage reusable question templates</p>
            </div>
            <Button onClick={() => router.push('/admin/templates/new')} className="hover-3d">
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          </div>
        </motion.div>

        <GlassPanel title="Templates" geometricOverlay>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTemplates()}
                  className="pl-10"
                />
              </div>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Climate">Climate</SelectItem>
                </SelectContent>
              </Select>
              <Select value={internalFilter} onValueChange={setInternalFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="true">Internal</SelectItem>
                  <SelectItem value="false">Public</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadTemplates} className="hover-3d">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No templates found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sector</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.sector}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.question_type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{template.content}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_internal ? 'default' : 'secondary'}>
                          {template.is_internal ? 'Internal' : 'Public'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/templates/${template.id}`)}
                            className="hover-3d"
                          >
                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(template.id)}
                            className="hover-3d text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}



