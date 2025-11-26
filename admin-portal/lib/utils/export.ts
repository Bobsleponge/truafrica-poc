import Papa from 'papaparse'
import jsPDF from 'jspdf'

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) {
  const { filename = 'export', includeHeaders = true } = options

  const csv = Papa.unparse(data, {
    header: includeHeaders,
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF(
  title: string,
  content: string | string[],
  options: ExportOptions = {}
) {
  const { filename = 'export' } = options
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Add title
  doc.setFontSize(16)
  doc.text(title, margin, yPosition)
  yPosition += 10

  // Add content
  doc.setFontSize(10)
  const lines = Array.isArray(content) ? content : content.split('\n')
  
  lines.forEach((line) => {
    const textLines = doc.splitTextToSize(line, maxWidth)
    textLines.forEach((textLine: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(textLine, margin, yPosition)
      yPosition += 7
    })
  })

  doc.save(`${filename}.pdf`)
}

export function exportTableToPDF<T extends Record<string, any>>(
  title: string,
  data: T[],
  columns: { key: string; label: string }[],
  options: ExportOptions = {}
) {
  const { filename = 'export' } = options
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const tableStartY = 30
  let currentY = tableStartY

  // Add title
  doc.setFontSize(16)
  doc.text(title, margin, currentY)
  currentY += 15

  // Table headers
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  const colWidth = (pageWidth - 2 * margin) / columns.length
  let xPosition = margin

  columns.forEach((col) => {
    doc.text(col.label, xPosition, currentY)
    xPosition += colWidth
  })

  currentY += 7
  doc.setFont(undefined, 'normal')

  // Table rows
  data.forEach((row) => {
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      currentY = margin + 10
    }

    xPosition = margin
    columns.forEach((col) => {
      const value = String(row[col.key] || '')
      doc.text(value.substring(0, 20), xPosition, currentY)
      xPosition += colWidth
    })
    currentY += 7
  })

  doc.save(`${filename}.pdf`)
}



