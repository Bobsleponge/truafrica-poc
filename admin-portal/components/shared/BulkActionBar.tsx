'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Edit, CheckSquare } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

interface BulkAction {
  label: string
  action: () => void
  variant?: 'default' | 'destructive'
  icon?: React.ReactNode
}

interface BulkActionBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClearSelection: () => void
}

export function BulkActionBar({ selectedCount, actions, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between p-4 bg-accent/50 border border-cyan-500/20 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-cyan-500" />
          <span className="font-medium">{selectedCount} selected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'default'}
            size="sm"
            onClick={action.action}
          >
            {action.icon || <Edit className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}



