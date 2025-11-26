'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassPanel } from '@/components/admin/GlassPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Search, RefreshCw, Filter, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface AdminCampaign {
  id: string
  name: string
  description: string | null
  status: string
  client_id: string
  client_name: string
  total_questions: number
  total_responses: number
  required_responses: number
  completion_rate: number
  created_at: string
  updated_at: string
}

export default function AdminCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadCampaigns()
  }, [statusFilter, page])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/admin/campaigns?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        let filtered = data.campaigns || []
        
        // Apply search filter
        if (search) {
          filtered = filtered.filter((c: AdminCampaign) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.client_name.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        setCampaigns(filtered)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err: any) {
      console.error('Error loading campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-muted-foreground">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Campaign Management</h1>
              <p className="text-muted-foreground">View and manage all campaigns</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="hover-3d">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button variant="outline" onClick={loadCampaigns} className="hover-3d">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        <GlassPanel title="Campaigns" geometricOverlay>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by campaign name or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadCampaigns()}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No campaigns found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.client_name}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === 'draft' ? 'outline' : campaign.status === 'running' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AnimatedCounter value={campaign.total_questions} />
                        </TableCell>
                        <TableCell>
                          <AnimatedCounter value={campaign.total_responses} /> / <AnimatedCounter value={campaign.required_responses} />
                        </TableCell>
                        <TableCell>
                          <AnimatedCounter value={campaign.completion_rate} formatValue={(v) => `${v.toFixed(1)}%`} />
                        </TableCell>
                        <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                            className="hover-3d"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}


