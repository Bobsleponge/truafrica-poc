/**
 * Export Service
 * Handles campaign export in various formats
 */

import { createClient } from '@/lib/supabase/server'
import type { CampaignBuilderData } from '@/types/campaign-builder'

/**
 * Export campaign to PDF (using react-pdf on client side)
 * This function prepares the data for PDF generation
 */
export function preparePDFData(campaignData: CampaignBuilderData): any {
  return {
    title: `Campaign: ${campaignData.companyName}`,
    sections: [
      {
        title: 'Company Information',
        content: {
          companyName: campaignData.companyName,
          industry: campaignData.industry,
          contactDetails: campaignData.contactDetails,
          regionsOfOperation: campaignData.regionsOfOperation,
        },
      },
      {
        title: 'Campaign Objectives',
        content: {
          primaryGoal: campaignData.primaryGoal,
          secondaryGoals: campaignData.secondaryGoals,
          useCaseDescription: campaignData.useCaseDescription,
        },
      },
      {
        title: 'Target Audience',
        content: {
          targetCountries: campaignData.targetCountries,
          demographics: {
            ageBracket: campaignData.ageBracket,
            occupation: campaignData.occupation,
            languages: campaignData.languages,
          },
        },
      },
      {
        title: 'Questions',
        content: campaignData.questions?.map((q, i) => ({
          number: i + 1,
          content: q.content,
          type: q.questionType,
          requiredResponses: q.requiredResponses,
        })),
      },
      {
        title: 'Rewards & Pricing',
        content: {
          rewardBudget: campaignData.rewardBudget,
          pricing: campaignData.pricing,
        },
      },
      {
        title: 'Summary',
        content: {
          summary: campaignData.campaignSummary,
          risks: campaignData.operationalRisks,
          mitigations: campaignData.mitigations,
        },
      },
    ],
  }
}

/**
 * Export campaign to Markdown
 */
export function exportToMarkdown(campaignData: CampaignBuilderData): string {
  let markdown = `# Campaign: ${campaignData.companyName}\n\n`
  markdown += `**Industry:** ${campaignData.industry}\n\n`
  markdown += `**Created:** ${new Date().toLocaleDateString()}\n\n`

  markdown += `## Company Information\n\n`
  markdown += `- **Company:** ${campaignData.companyName}\n`
  markdown += `- **Industry:** ${campaignData.industry}\n`
  if (campaignData.contactDetails?.email) {
    markdown += `- **Email:** ${campaignData.contactDetails.email}\n`
  }
  if (campaignData.contactDetails?.phone) {
    markdown += `- **Phone:** ${campaignData.contactDetails.phone}\n`
  }
  markdown += `- **Regions:** ${campaignData.regionsOfOperation?.join(', ') || 'N/A'}\n\n`

  markdown += `## Campaign Objectives\n\n`
  markdown += `### Primary Goal\n\n${campaignData.primaryGoal || 'N/A'}\n\n`
  if (campaignData.secondaryGoals && campaignData.secondaryGoals.length > 0) {
    markdown += `### Secondary Goals\n\n`
    campaignData.secondaryGoals.forEach(goal => {
      markdown += `- ${goal}\n`
    })
    markdown += `\n`
  }
  markdown += `### Use Case\n\n${campaignData.useCaseDescription || 'N/A'}\n\n`

  markdown += `## Target Audience\n\n`
  markdown += `- **Countries:** ${campaignData.targetCountries?.join(', ') || 'N/A'}\n`
  if (campaignData.ageBracket) {
    markdown += `- **Age Range:** ${campaignData.ageBracket.min || 'N/A'} - ${campaignData.ageBracket.max || 'N/A'}\n`
  }
  if (campaignData.languages && campaignData.languages.length > 0) {
    markdown += `- **Languages:** ${campaignData.languages.join(', ')}\n`
  }
  markdown += `- **Number of Respondents:** ${campaignData.numberOfRespondents || 'N/A'}\n\n`

  markdown += `## Questions\n\n`
  if (campaignData.questions && campaignData.questions.length > 0) {
    campaignData.questions.forEach((q, i) => {
      markdown += `### Question ${i + 1}\n\n`
      markdown += `**Type:** ${q.questionType}\n\n`
      markdown += `**Content:** ${q.content || 'N/A'}\n\n`
      markdown += `**Required Responses:** ${q.requiredResponses || 10}\n\n`
      if (q.options && q.options.length > 0) {
        markdown += `**Options:**\n`
        q.options.forEach(opt => {
          markdown += `- ${opt}\n`
        })
        markdown += `\n`
      }
    })
  } else {
    markdown += `No questions defined.\n\n`
  }

  markdown += `## Rewards & Pricing\n\n`
  markdown += `- **Reward Budget:** $${campaignData.rewardBudget?.toFixed(2) || '0.00'}\n`
  if (campaignData.pricing) {
    markdown += `- **Total Price:** $${campaignData.pricing.totalPrice?.toFixed(2) || '0.00'}\n`
    markdown += `- **Margin:** ${campaignData.pricing.marginPercentage?.toFixed(1) || '0'}%\n\n`
  }

  if (campaignData.campaignSummary) {
    markdown += `## Summary\n\n${campaignData.campaignSummary}\n\n`
  }

  if (campaignData.operationalRisks && campaignData.operationalRisks.length > 0) {
    markdown += `## Operational Risks\n\n`
    campaignData.operationalRisks.forEach(risk => {
      markdown += `- ${risk}\n`
    })
    markdown += `\n`
  }

  if (campaignData.mitigations && campaignData.mitigations.length > 0) {
    markdown += `## Mitigations\n\n`
    campaignData.mitigations.forEach(mitigation => {
      markdown += `- ${mitigation}\n`
    })
    markdown += `\n`
  }

  return markdown
}

/**
 * Export campaign to JSON
 */
export function exportToJSON(campaignData: CampaignBuilderData): string {
  return JSON.stringify(campaignData, null, 2)
}

/**
 * Generate shareable link
 */
export async function generateShareableLink(
  campaignId: string,
  expiresInDays: number = 7
): Promise<string> {
  const supabase = await createClient()

  // Create a share token
  const shareToken = Buffer.from(`${campaignId}:${Date.now()}`).toString('base64')
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  // Store share token in campaign metadata
  // In production, you might want to create a dedicated shares table
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('wizard_data')
    .eq('id', campaignId)
    .single()

  if (campaign) {
    const wizardData = (campaign.wizard_data as any) || {}
    wizardData.shareToken = shareToken
    wizardData.shareExpiresAt = expiresAt.toISOString()

    await supabase
      .from('campaigns')
      .update({ wizard_data: wizardData })
      .eq('id', campaignId)
  }

  // Return shareable URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/campaigns/share/${shareToken}`
}

