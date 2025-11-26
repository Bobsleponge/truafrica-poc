'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Shield, AlertTriangle, TrendingUp, Download, Eye, Trash2, Key } from 'lucide-react'
import type { SecurityEvent, ApiUsageStats } from '@/types/admin'

interface ApiKey {
  id: string
  name: string
  client_id: string
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
  users: {
    email: string
    name: string | null
    role: string
  }
}

export default function AdminSecurityPage() {
  const [stats, setStats] = useState<ApiUsageStats | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewingEvent, setViewingEvent] = useState<SecurityEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])

  useEffect(() => {
    loadSecurityData()
    loadApiKeys()
    setupSSE()
  }, [page, typeFilter])

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys')
      const data = await response.json()
      if (data.success) {
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Error loading API keys:', err)
    }
  }

  const loadSecurityData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`/api/admin/security?${params}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      setStats(data.stats)
      setEvents(data.events || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading security data:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'api_usage') {
          loadSecurityData()
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }

  const getEventTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'rate_limit':
      case 'auth_failure':
      case 'suspicious_activity':
        return 'destructive'
      case 'api_request':
        return 'default'
      default:
        return 'outline'
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      loadApiKeys()
    } catch (err: any) {
      alert(`Error revoking API key: ${err.message}`)
    }
  }

  const exportSecurityData = () => {
    if (!stats || events.length === 0) return

    const csv = [
      ['Type', 'Endpoint', 'Method', 'Status Code', 'User', 'Timestamp'].join(','),
      ...events.map(e => [
        e.type,
        e.endpoint || '',
        e.method || '',
        e.status_code?.toString() || '',
        e.user_email || '',
        new Date(e.timestamp).toISOString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-events-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate usage trend data (mock - in production, fetch historical data)
  const generateUsageTrendData = () => {
    const hours = 24
    const data = []
    for (let i = hours - 1; i >= 0; i--) {
      const date = new Date()
      date.setHours(date.getHours() - i)
      data.push({
        hour: date.toLocaleTimeString('en-US', { hour: 'numeric' }),
        requests: stats && stats.requestsLast24Hours ? Math.floor(stats.requestsLast24Hours * (0.5 + Math.random() * 1.0) / hours) : 0,
        errors: stats && stats.errorsLast24Hours ? Math.floor(stats.errorsLast24Hours * (0.3 + Math.random() * 0.7) / hours) : 0,
      })
    }
    return data
  }

  // Generate security alerts
  useEffect(() => {
    if (stats) {
      const alerts: any[] = []
      if (stats.rateLimitHits > 10) {
        alerts.push({
          type: 'warning',
          message: `High rate limit hits: ${stats.rateLimitHits}`,
          severity: 'high',
        })
      }
      if (stats.errorsLast24Hours > 100) {
        alerts.push({
          type: 'error',
          message: `High error rate: ${stats.errorsLast24Hours} errors in last 24h`,
          severity: 'high',
        })
      }
      if (stats.requestsLastHour > 500) {
        alerts.push({
          type: 'info',
          message: `High API usage: ${stats.requestsLastHour} requests in last hour`,
          severity: 'medium',
        })
      }
      setSecurityAlerts(alerts)
    }
  }, [stats])

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">Security & API Monitoring</h1>
        <p className="text-muted-foreground">Monitor API usage and security events</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="space-y-2">
          {securityAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'default' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* API Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.requestsLastHour}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeKeys}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.rateLimitHits}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Trends Chart */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              API Usage Trends (Last 24h)
            </CardTitle>
            <CardDescription>Request volume and error trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateUsageTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" name="Requests" />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Endpoints */}
      {stats && stats.topEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Endpoints (Last 24h)</CardTitle>
                <CardDescription>Most frequently accessed endpoints</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportSecurityData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.topEndpoints.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Management
          </CardTitle>
          <CardDescription>Manage all API keys in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No API keys found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => {
                  const user = Array.isArray(key.users) ? key.users[0] : key.users
                  return (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>{user?.email || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user?.role === 'admin' || user?.role === 'platform_admin' ? 'default' : 
                          user?.role === 'client_owner' || user?.role === 'client_user' ? 'secondary' : 
                          'outline'
                        }>
                          {user?.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        {key.revoked_at ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(key.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {!key.revoked_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Recent API usage and security events</CardDescription>
            </div>
            <Select value={typeFilter} onValueChange={(value) => {
              setTypeFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="rate_limit">Rate Limits</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No events found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      setViewingEvent(event)
                      setShowEventDialog(true)
                    }}>
                      <TableCell>
                        <Badge variant={getEventTypeBadgeVariant(event.type)}>
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.endpoint || '-'}
                      </TableCell>
                      <TableCell>{event.method || '-'}</TableCell>
                      <TableCell>
                        {event.status_code ? (
                          <Badge
                            variant={
                              event.status_code >= 500
                                ? 'destructive'
                                : event.status_code >= 400
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {event.status_code}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{event.user_email || '-'}</TableCell>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation()
                          setViewingEvent(event)
                          setShowEventDialog(true)
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      {viewingEvent && (
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Security Event Details</DialogTitle>
              <DialogDescription>Complete event information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Badge variant={getEventTypeBadgeVariant(viewingEvent.type)} className="mt-1">
                  {viewingEvent.type}
                </Badge>
              </div>
              <div>
                <Label>Endpoint</Label>
                <p className="text-sm font-mono mt-1 p-2 bg-muted rounded">{viewingEvent.endpoint || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Method</Label>
                  <p className="text-sm mt-1">{viewingEvent.method || 'N/A'}</p>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <p className="text-sm mt-1">
                    {viewingEvent.status_code ? (
                      <Badge variant={viewingEvent.status_code >= 500 ? 'destructive' : viewingEvent.status_code >= 400 ? 'secondary' : 'default'}>
                        {viewingEvent.status_code}
                      </Badge>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm mt-1">{viewingEvent.user_email || 'N/A'}</p>
                </div>
                <div>
                  <Label>API Key</Label>
                  <p className="text-sm mt-1">{viewingEvent.api_key_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label>Timestamp</Label>
                <p className="text-sm mt-1">{new Date(viewingEvent.timestamp).toLocaleString()}</p>
              </div>
              {Object.keys(viewingEvent.metadata || {}).length > 0 && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(viewingEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => {
                  setShowEventDialog(false)
                  setViewingEvent(null)
                }}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

