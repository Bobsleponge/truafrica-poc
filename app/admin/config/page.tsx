'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Database, Server, Save, Download, Upload, FileText, ToggleLeft } from 'lucide-react'

interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  value?: string
}

export default function AdminConfigPage() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [systemLogs, setSystemLogs] = useState<string[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: '1', name: 'new_onboarding_flow', description: 'Enable new contributor onboarding flow', enabled: true },
    { id: '2', name: 'ml_validation', description: 'Enable ML-based answer validation', enabled: true },
    { id: '3', name: 'advanced_analytics', description: 'Enable advanced analytics dashboard', enabled: false },
    { id: '4', name: 'real_time_notifications', description: 'Enable real-time notifications', enabled: true },
  ])
  const [configValues, setConfigValues] = useState({
    rateLimit: '1000',
    maxAnswersPerQuestion: '50',
    minTrustScore: '30',
  })

  useEffect(() => {
    loadHealth()
    loadSystemLogs()
  }, [])

  const loadHealth = async () => {
    try {
      const response = await fetch('/api/admin/health')
      const data = await response.json()
      if (data.success) {
        setHealth(data.health)
      }
    } catch (err) {
      console.error('Error loading health:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSystemLogs = () => {
    // Mock system logs - in production, fetch from log service
    const mockLogs = [
      `[${new Date().toISOString()}] INFO: Server started successfully`,
      `[${new Date(Date.now() - 3600000).toISOString()}] INFO: Database connection established`,
      `[${new Date(Date.now() - 7200000).toISOString()}] WARN: High API usage detected`,
      `[${new Date(Date.now() - 10800000).toISOString()}] INFO: Cache cleared`,
    ]
    setSystemLogs(mockLogs)
  }

  const handleSaveConfig = async () => {
    // In production, this would save to database or config service
    alert('Configuration saved (mock - requires backend implementation)')
  }

  const handleToggleFeature = (flagId: string) => {
    setFeatureFlags(prev => prev.map(flag =>
      flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
    ))
  }

  const exportConfig = () => {
    const config = {
      timestamp: new Date().toISOString(),
      configValues,
      featureFlags,
      health,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 gradient-text">System Configuration</h1>
          <p className="text-muted-foreground">System settings and configuration</p>
        </div>
        <Button variant="outline" onClick={exportConfig}>
          <Download className="h-4 w-4 mr-2" />
          Export Config
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Database Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>Database connection status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : health ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Status</Label>
                    <Badge variant={health.database.connected ? 'default' : 'destructive'}>
                      {health.database.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Response Time</Label>
                    <span>{health.database.responseTime}ms</span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Unable to load database info</div>
              )}
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>API settings and rate limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Rate Limit (per hour)</Label>
                  <Input
                    value={configValues.rateLimit}
                    onChange={(e) => setConfigValues({ ...configValues, rateLimit: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum requests per API key per hour
                  </p>
                </div>
                <div>
                  <Label>Max Answers Per Question</Label>
                  <Input
                    value={configValues.maxAnswersPerQuestion}
                    onChange={(e) => setConfigValues({ ...configValues, maxAnswersPerQuestion: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Minimum Trust Score</Label>
                  <Input
                    value={configValues.minTrustScore}
                    onChange={(e) => setConfigValues({ ...configValues, minTrustScore: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input value={typeof window !== 'undefined' ? window.location.origin : ''} disabled />
                </div>
                <Button onClick={handleSaveConfig}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Read-only system information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Environment</Label>
                  <Input value={process.env.NODE_ENV || 'development'} disabled />
                </div>
                <div>
                  <Label>Supabase Project</Label>
                  <Input
                    value={process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'Not configured'}
                    disabled
                  />
                </div>
                <div>
                  <Label>Node Version</Label>
                  <Input value={typeof process !== 'undefined' ? process.version : 'N/A'} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable system features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{flag.name}</Label>
                        <Badge variant={flag.enabled ? 'default' : 'outline'}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                    </div>
                    <Checkbox
                      checked={flag.enabled}
                      onCheckedChange={() => handleToggleFeature(flag.id)}
                    />
                  </div>
                ))}
                <Button onClick={handleSaveConfig} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Feature Flags
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Logs
              </CardTitle>
              <CardDescription>Recent system logs and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {systemLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No logs available</div>
                ) : (
                  systemLogs.map((log, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                      {log}
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="mt-4" onClick={loadSystemLogs}>
                Refresh Logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Database backup and restore operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Last Backup</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(Date.now() - 86400000).toLocaleString()} (24 hours ago)
                </p>
              </div>
              <div>
                <Label>Backup Frequency</Label>
                <p className="text-sm text-muted-foreground mt-1">Daily automatic backups</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  Backup and restore operations require database administrator privileges.
                  Contact your system administrator for assistance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert>
        <AlertDescription>
          Some configuration changes require server restart. Contact system administrator for modifications.
        </AlertDescription>
      </Alert>
    </div>
  )
}

