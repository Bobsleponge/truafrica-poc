/**
 * Collaboration Service
 * Real-time collaboration using Supabase Realtime
 */

import { createClient } from '@/lib/supabase/server'
import type { CollaboratorRole } from '@/types/campaign-builder'

export interface Collaborator {
  id: string
  campaign_id: string
  user_id: string
  role: CollaboratorRole
  last_active_at: string
  created_at: string
  user?: {
    name: string
    email: string
  }
}

/**
 * Subscribe to campaign changes (for real-time updates)
 */
export async function subscribeToCampaign(
  campaignId: string,
  callback: (payload: any) => void
): Promise<() => void> {
  const supabase = await createClient()
  
  const channel = supabase
    .channel(`campaign:${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${campaignId}`,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Update campaign with real-time sync
 */
export async function updateCampaign(
  campaignId: string,
  updates: Record<string, any>,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  // Update last active time for collaborator
  await supabase
    .from('campaign_collaborators')
    .upsert({
      campaign_id: campaignId,
      user_id: userId,
      last_active_at: new Date().toISOString(),
    }, {
      onConflict: 'campaign_id,user_id',
    })

  // Update campaign
  const { error } = await supabase
    .from('campaigns')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`)
  }
}

/**
 * Get active collaborators for a campaign
 */
export async function getActiveCollaborators(
  campaignId: string
): Promise<Collaborator[]> {
  const supabase = await createClient()

  // Get collaborators active in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('campaign_collaborators')
    .select(`
      *,
      user:users!campaign_collaborators_user_id_fkey (
        name,
        email
      )
    `)
    .eq('campaign_id', campaignId)
    .gte('last_active_at', fiveMinutesAgo)
    .order('last_active_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get collaborators: ${error.message}`)
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    campaign_id: item.campaign_id,
    user_id: item.user_id,
    role: item.role,
    last_active_at: item.last_active_at,
    created_at: item.created_at,
    user: item.user,
  }))
}

/**
 * Add collaborator to campaign
 */
export async function addCollaborator(
  campaignId: string,
  userId: string,
  role: CollaboratorRole = 'editor'
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaign_collaborators')
    .insert({
      campaign_id: campaignId,
      user_id: userId,
      role,
      last_active_at: new Date().toISOString(),
    })

  if (error) {
    throw new Error(`Failed to add collaborator: ${error.message}`)
  }
}

/**
 * Remove collaborator from campaign
 */
export async function removeCollaborator(
  campaignId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaign_collaborators')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to remove collaborator: ${error.message}`)
  }
}



