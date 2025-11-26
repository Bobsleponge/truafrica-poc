'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { CampaignBuilderData } from '@/types/campaign-builder'

export default function ShareableCampaignPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignData, setCampaignData] = useState<CampaignBuilderData | null>(null)
  const [campaignName, setCampaignName] = useState<string>('')

  useEffect(() => {
    if (token) {
      loadCampaignFromToken()
    }
  }, [token])

  const loadCampaignFromToken = async () => {
    try {
      // Fetch campaign via API endpoint
      const response = await fetch(`/api/campaigns/share/${token}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load campaign')
      }

      setCampaignName(data.campaign.name)
      setCampaignData(data.campaign.wizard_data as CampaignBuilderData)
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !campaignData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Campaign not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{campaignName}</CardTitle>
            <CardDescription>Shared Campaign Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Information */}
            {campaignData.companyName && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Company:</strong> {campaignData.companyName}</div>
                  {campaignData.industry && (
                    <div><strong>Industry:</strong> {campaignData.industry}</div>
                  )}
                  {campaignData.regionsOfOperation && campaignData.regionsOfOperation.length > 0 && (
                    <div><strong>Regions:</strong> {campaignData.regionsOfOperation.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Campaign Objectives */}
            {campaignData.primaryGoal && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Primary Goal</h3>
                <p className="text-sm">{campaignData.primaryGoal}</p>
              </div>
            )}

            {campaignData.useCaseDescription && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Use Case</h3>
                <p className="text-sm">{campaignData.useCaseDescription}</p>
              </div>
            )}

            {/* Target Audience */}
            {(campaignData.targetCountries && campaignData.targetCountries.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Audience</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Countries:</strong> {campaignData.targetCountries.join(', ')}</div>
                  {campaignData.numberOfRespondents && (
                    <div><strong>Number of Respondents:</strong> {campaignData.numberOfRespondents}</div>
                  )}
                  {campaignData.ageBracket && (
                    <div>
                      <strong>Age Range:</strong> {campaignData.ageBracket.min || 'N/A'} - {campaignData.ageBracket.max || 'N/A'}
                    </div>
                  )}
                  {campaignData.languages && campaignData.languages.length > 0 && (
                    <div><strong>Languages:</strong> {campaignData.languages.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Questions */}
            {campaignData.questions && campaignData.questions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Questions ({campaignData.questions.length})</h3>
                <div className="space-y-3">
                  {campaignData.questions.map((q, idx) => (
                    <Card key={idx} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Question {idx + 1}</Badge>
                              {q.questionType && (
                                <Badge variant="secondary">{q.questionType}</Badge>
                              )}
                              {q.complexityLevel && (
                                <Badge variant="outline">{q.complexityLevel}</Badge>
                              )}
                            </div>
                            <p className="text-sm">{q.content || 'No content'}</p>
                            {q.requiredResponses && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Required responses: {q.requiredResponses}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            {campaignData.pricing && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Pricing Summary</h3>
                <div className="space-y-1 text-sm">
                  {campaignData.pricing.totalPrice && (
                    <div><strong>Total Price:</strong> ${campaignData.pricing.totalPrice.toFixed(2)}</div>
                  )}
                  {campaignData.pricing.marginPercentage !== undefined && (
                    <div><strong>Margin:</strong> {campaignData.pricing.marginPercentage.toFixed(1)}%</div>
                  )}
                  {campaignData.rewardBudget && (
                    <div><strong>Reward Budget:</strong> ${campaignData.rewardBudget.toFixed(2)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {campaignData.campaignSummary && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Campaign Summary</h3>
                <p className="text-sm whitespace-pre-wrap">{campaignData.campaignSummary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

