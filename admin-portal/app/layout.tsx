import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TruAfrica Admin Portal',
  description: 'Platform administration portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
        {children}
      </body>
    </html>
  )
}

