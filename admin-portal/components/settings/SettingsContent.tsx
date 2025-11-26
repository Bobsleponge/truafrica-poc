'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Download, Upload, History, RotateCcw } from 'lucide-react'
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator'
import { usePolling } from '@/lib/hooks/usePolling'
import type { PlatformSettings } from '@/types'

export default function SettingsContent() {
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [formData, setFormData] = useState({
    defaultRewardAmount: '',
    rewardCurrency: 'USD',
    minReward: '',
    maxReward: '',
    allowNewRegistrations: true,
    maintenanceMode: false,
    enableRewards: true,
    internalNotes: '',
  })

  // Load settings with polling
  const { data: settingsData, loading, lastUpdated, refetch } = usePolling<{ settings: PlatformSettings }>(
    async () => {
      const response = await fetch('/admin/api/settings/get')
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const settings = settingsData?.settings

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultRewardAmount: String(settings.reward_settings?.default_reward_amount || ''),
        rewardCurrency: settings.reward_settings?.reward_currency || 'USD',
        minReward: String(settings.reward_settings?.min_reward || ''),
        maxReward: String(settings.reward_settings?.max_reward || ''),
        allowNewRegistrations: settings.system_toggles?.allow_new_registrations ?? true,
        maintenanceMode: settings.system_toggles?.maintenance_mode ?? false,
        enableRewards: settings.system_toggles?.enable_rewards ?? true,
        internalNotes: settings.internal_notes || '',
      })
    }
  }, [settings])

  const loadHistory = async () => {
    try {
      const response = await fetch('/admin/api/settings/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/admin/api/settings/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_settings: {
            default_reward_amount: parseFloat(formData.defaultRewardAmount) || undefined,
            reward_currency: formData.rewardCurrency,
            min_reward: parseFloat(formData.minReward) || undefined,
            max_reward: parseFloat(formData.maxReward) || undefined,
          },
          system_toggles: {
            allow_new_registrations: formData.allowNewRegistrations,
            maintenance_mode: formData.maintenanceMode,
            enable_rewards: formData.enableRewards,
          },
          internal_notes: formData.internalNotes,
        }),
      })

      if (response.ok) {
        refetch()
        alert('Settings saved successfully')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRollback = async (versionId: string) => {
    try {
      const response = await fetch('/admin/api/settings/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })

      if (response.ok) {
        refetch()
        alert('Settings rolled back successfully')
      } else {
        alert('Failed to rollback settings')
      }
    } catch (error) {
      console.error('Error rolling back settings:', error)
      alert('Error rolling back settings')
    }
  }

  const handleExport = async () => {
    const response = await fetch('/admin/api/settings/export?format=json')
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `settings-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const importedSettings = JSON.parse(text)

    try {
      const response = await fetch('/admin/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: importedSettings }),
      })

      if (response.ok) {
        refetch()
        alert('Settings imported successfully')
      } else {
        alert('Failed to import settings')
      }
    } catch (error) {
      console.error('Error importing settings:', error)
      alert('Error importing settings')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Global platform configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeIndicator lastUpdated={lastUpdated} isUpdating={loading} />
          <Button variant="outline" onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory() }}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Settings History</CardTitle>
            <CardDescription>Previous versions of settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(item.updated_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated by: {item.updated_by || 'System'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(item.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rollback
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reward Settings
          </CardTitle>
          <CardDescription>Configure reward amounts and currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Reward Amount</label>
              <Input
                type="number"
                value={formData.defaultRewardAmount}
                onChange={(e) => setFormData({ ...formData, defaultRewardAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reward Currency</label>
              <Input
                value={formData.rewardCurrency}
                onChange={(e) => setFormData({ ...formData, rewardCurrency: e.target.value })}
                placeholder="USD"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min Reward</label>
              <Input
                type="number"
                value={formData.minReward}
                onChange={(e) => setFormData({ ...formData, minReward: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Reward</label>
              <Input
                type="number"
                value={formData.maxReward}
                onChange={(e) => setFormData({ ...formData, maxReward: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle>System Toggles</CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Allow New Registrations</div>
              <div className="text-sm text-muted-foreground">Allow new users to sign up</div>
            </div>
            <input
              type="checkbox"
              checked={formData.allowNewRegistrations}
              onChange={(e) => setFormData({ ...formData, allowNewRegistrations: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm text-muted-foreground">Put platform in maintenance mode</div>
            </div>
            <input
              type="checkbox"
              checked={formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Rewards</div>
              <div className="text-sm text-muted-foreground">Allow reward distribution</div>
            </div>
            <input
              type="checkbox"
              checked={formData.enableRewards}
              onChange={(e) => setFormData({ ...formData, enableRewards: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>Internal notes and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background"
            placeholder="Add internal notes here..."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
