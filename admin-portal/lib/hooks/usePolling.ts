'use client'

import { useEffect, useRef, useState } from 'react'

interface UsePollingOptions {
  interval?: number // in milliseconds
  enabled?: boolean
  onError?: (error: Error) => void
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const fetchData = async () => {
    if (!mountedRef.current) return
    
    try {
      setLoading(true)
      const result = await fetchFn()
      if (mountedRef.current) {
        setData(result)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    
    // Initial fetch
    fetchData()

    // Set up polling
    if (enabled) {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, interval)
    }

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval])

  const refetch = () => {
    fetchData()
  }

  return { data, loading, error, lastUpdated, refetch }
}



