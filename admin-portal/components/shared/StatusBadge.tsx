'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Campaign statuses
  draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-500' },
  active: { label: 'Active', className: 'bg-green-500/10 text-green-500' },
  running: { label: 'Running', className: 'bg-green-500/10 text-green-500' },
  paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500' },
  completed: { label: 'Completed', className: 'bg-blue-500/10 text-blue-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-500' },
  archived: { label: 'Archived', className: 'bg-gray-500/10 text-gray-500' },
  
  // Client statuses
  inactive: { label: 'Inactive', className: 'bg-gray-500/10 text-gray-500' },
  suspended: { label: 'Suspended', className: 'bg-red-500/10 text-red-500' },
  
  // User roles
  platform_admin: { label: 'Platform Admin', className: 'bg-purple-500/10 text-purple-500' },
  client: { label: 'Client', className: 'bg-blue-500/10 text-blue-500' },
  team: { label: 'Team', className: 'bg-cyan-500/10 text-cyan-500' },
  contributor: { label: 'Contributor', className: 'bg-green-500/10 text-green-500' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-500/10 text-gray-500' }
  
  return (
    <span className={cn('px-2 py-1 rounded text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}



