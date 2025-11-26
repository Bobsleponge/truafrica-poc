'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  const updateTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    // Check localStorage or default to dark
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark'
    setTheme(savedTheme)
    updateTheme(savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    updateTheme(newTheme)
  }

  // Always provide the context, but apply theme only when mounted
  // This prevents hydration mismatch while ensuring context is always available
  useEffect(() => {
    if (mounted) {
      updateTheme(theme)
    } else {
      // Set default dark mode on initial load
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark')
      }
    }
  }, [mounted, theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

