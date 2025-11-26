/**
 * Version Control Service
 * Manages campaign versions and history
 */

import { createClient } from '@/lib/supabase/server'
import type { CampaignBuilderData } from '@/types/campaign-builder'

export interface CampaignVersion {
  id: string
  campaign_id: string
  version_number: number
  data: CampaignBuilderData
  created_by: string
  created_at: string
  notes?: string
}

/**
 * Create a new version of a campaign
 */
export async function createVersion(
  campaignId: string,
  data: CampaignBuilderData,
  userId: string,
  notes?: string
): Promise<CampaignVersion> {
  const supabase = await createClient()

  // Get current max version number
  const { data: existingVersions } = await supabase
    .from('campaign_versions')
    .select('version_number')
    .eq('campaign_id', campaignId)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersionNumber = existingVersions && existingVersions.length > 0
    ? existingVersions[0].version_number + 1
    : 1

  // Create new version
  const { data: version, error } = await supabase
    .from('campaign_versions')
    .insert({
      campaign_id: campaignId,
      version_number: nextVersionNumber,
      data,
      created_by: userId,
      notes,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create version: ${error.message}`)
  }

  // Update campaign's current version
  await supabase
    .from('campaigns')
    .update({ current_version_id: version.id })
    .eq('id', campaignId)

  return version
}

/**
 * Get version history for a campaign
 */
export async function getVersionHistory(
  campaignId: string
): Promise<CampaignVersion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaign_versions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('version_number', { ascending: false })

  if (error) {
    throw new Error(`Failed to get version history: ${error.message}`)
  }

  return data || []
}

/**
 * Get a specific version
 */
export async function getVersion(
  versionId: string
): Promise<CampaignVersion | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaign_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) {
    throw new Error(`Failed to get version: ${error.message}`)
  }

  return data
}

/**
 * Restore a version (create a new version from an old one)
 */
export async function restoreVersion(
  campaignId: string,
  versionId: string,
  userId: string,
  notes?: string
): Promise<CampaignVersion> {
  const version = await getVersion(versionId)
  
  if (!version) {
    throw new Error('Version not found')
  }

  return createVersion(
    campaignId,
    version.data,
    userId,
    notes || `Restored from version ${version.version_number}`
  )
}

/**
 * Compare two versions
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<{
  version1: CampaignVersion
  version2: CampaignVersion
  differences: string[]
}> {
  const [version1, version2] = await Promise.all([
    getVersion(versionId1),
    getVersion(versionId2),
  ])

  if (!version1 || !version2) {
    throw new Error('One or both versions not found')
  }

  const differences: string[] = []

  // Compare key fields
  if (version1.data.companyName !== version2.data.companyName) {
    differences.push(`Company name changed`)
  }
  if (version1.data.primaryGoal !== version2.data.primaryGoal) {
    differences.push(`Primary goal changed`)
  }
  if (version1.data.questions?.length !== version2.data.questions?.length) {
    differences.push(`Question count changed: ${version1.data.questions?.length || 0} → ${version2.data.questions?.length || 0}`)
  }
  if (version1.data.numberOfRespondents !== version2.data.numberOfRespondents) {
    differences.push(`Number of respondents changed: ${version1.data.numberOfRespondents || 0} → ${version2.data.numberOfRespondents || 0}`)
  }

  return {
    version1,
    version2,
    differences,
  }
}



