'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown } from 'lucide-react'
import { exportToCSV, exportToPDF, exportTableToPDF } from '@/lib/utils/export'

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  filename?: string
  columns?: { key: string; label: string }[]
  title?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename = 'export',
  columns,
  title = 'Export',
  variant = 'outline',
  size = 'md',
}: ExportButtonProps<T>) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleCSVExport = () => {
    setLoading(true)
    try {
      exportToCSV(data, { filename })
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handlePDFExport = () => {
    setLoading(true)
    try {
      if (columns) {
        exportTableToPDF(title, data, columns, { filename })
      } else {
        const content = data.map((row) => JSON.stringify(row, null, 2)).join('\n\n')
        exportToPDF(title, content, { filename })
      }
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant={variant}
        size={size}
        disabled={loading || data.length === 0}
        onClick={() => setShowMenu(!showMenu)}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      {showMenu && (
        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-md shadow-lg z-10">
          <button
            onClick={handleCSVExport}
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-t-md transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handlePDFExport}
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-b-md transition-colors"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  )
}

