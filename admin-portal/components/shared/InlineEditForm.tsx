'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface InlineEditFormProps {
  value: string
  onSave: (value: string) => Promise<void> | void
  onCancel?: () => void
  type?: 'text' | 'textarea' | 'number' | 'email'
  placeholder?: string
  className?: string
}

export function InlineEditForm({
  value,
  onSave,
  onCancel,
  type = 'text',
  placeholder,
  className = '',
}: InlineEditFormProps) {
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (editValue === value) {
      onCancel?.()
      return
    }
    setSaving(true)
    try {
      await onSave(editValue)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    onCancel?.()
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {type === 'textarea' ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={saving}
      >
        <Check className="h-4 w-4 text-green-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={saving}
      >
        <X className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}



