import type { CampaignJourneyData, CampaignQuestion } from '@/types/campaign-journey'

export interface CampaignExportPayload {
  overview: CampaignJourneyData['overview']
  goals: CampaignJourneyData['goals']
  audience: CampaignJourneyData['audience']
  questions: CampaignQuestion[]
  rewards: CampaignJourneyData['rewards']
  scale: CampaignJourneyData['scale']
  pricing: CampaignJourneyData['pricing']
  generatedAt: string
}

export const buildCampaignExportPayload = (
  campaign: CampaignJourneyData
): CampaignExportPayload => ({
  overview: campaign.overview,
  goals: campaign.goals,
  audience: campaign.audience,
  questions: campaign.questions,
  rewards: campaign.rewards,
  scale: campaign.scale,
  pricing: campaign.pricing,
  generatedAt: new Date().toISOString(),
})

export const buildExecutiveSummary = (campaign: CampaignJourneyData, aiSummary?: string) => {
  if (aiSummary) return aiSummary

  const goal = campaign.goals.primaryGoal
  const respondentCount = campaign.scale.respondents || 0
  const targetCountry = campaign.audience.country || 'multi-market'

  return `TruAfrica will execute a ${goal || 'data'} campaign targeting ${targetCountry} with ${
    respondentCount || 'N/A'
  } respondents. The objective is "${campaign.overview.oneLineObjective || 'No objective provided'}" for ${
    campaign.overview.companyName || 'our client'
  }.`
}



