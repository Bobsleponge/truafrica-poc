'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types/database'

export default function TeamClientsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      loadClients()
    }
  }, [user, authLoading])

  const loadClients = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user!.id)
        .single()

      if (userData?.role !== 'team_account') {
        router.push('/')
        return
      }

      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && clientsData) {
        setClients(clientsData as Client[])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Link href="/team/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold gradient-text mb-2">All Clients</h1>
        <p className="text-muted-foreground">View and manage all client organizations</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Link key={client.id} href={`/team/clients/${client.id}`}>
            <GlassCard className="hover:border-primary/50 transition-colors cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {client.name}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                  {client.industry && (
                    <Badge variant="outline">{client.industry}</Badge>
                  )}
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No clients found</p>
      )}
    </div>
  )
}



