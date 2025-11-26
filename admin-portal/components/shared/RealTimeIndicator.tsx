'use client'

import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RealTimeIndicatorProps {
  lastUpdated: Date | null
  isUpdating?: boolean
}

export function RealTimeIndicator({ lastUpdated, isUpdating = false }: RealTimeIndicatorProps) {
  if (!lastUpdated) return null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {isUpdating ? (
        <span>Updating...</span>
      ) : (
        <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
      )}
    </div>
  )
}



