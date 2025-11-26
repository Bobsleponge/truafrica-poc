'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ActionButton {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive' | 'ghost'
  disabled?: boolean
  loading?: boolean
}

interface ActionButtonsProps {
  actions: ActionButton[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function ActionButtons({
  actions,
  className,
  orientation = 'horizontal',
}: ActionButtonsProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <Button
            key={index}
            variant={action.variant || 'default'}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className="hover-3d"
          >
            {action.loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Loading...
              </>
            ) : (
              <>
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </>
            )}
          </Button>
        )
      })}
    </div>
  )
}



