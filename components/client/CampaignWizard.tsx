'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react'
import type { QuestionType, DifficultyLevel } from '@/types/database'

interface CampaignWizardProps {
  onSubmit: (data: CampaignWizardData) => Promise<void>
  submitting?: boolean
  expertiseFields?: Array<{ id: string; name: string }>
}

export interface CampaignWizardData {
  // Step 1: Basic Info
  name: string
  description: string
  objective: string
  
  // Step 2: Target Audience
  targetCountries: string[]
  targetDemo: Record<string, any>
  
  // Step 3: Questions
  questions: Array<{
    questionId?: string
    content?: string
    fieldId?: string
    questionType: QuestionType
    complexityLevel: DifficultyLevel
    requiredResponses: number
  }>
  needsQuestionDesign: boolean
  
  // Step 4: Pricing
  urgency: 'standard' | 'express'
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Campaign name and objectives' },
  { id: 2, title: 'Target Audience', description: 'Countries and demographics' },
  { id: 3, title: 'Questions', description: 'Upload questions or request design' },
  { id: 4, title: 'Pricing Review', description: 'Review costs and confirm' },
]

const AFRICAN_COUNTRIES = [
  'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 'Uganda',
  'Ethiopia', 'Morocco', 'Algeria', 'Angola', 'Sudan', 'Mozambique',
  'Madagascar', 'Cameroon', 'Ivory Coast', 'Niger', 'Burkina Faso',
  'Mali', 'Malawi', 'Zambia', 'Zimbabwe', 'Senegal', 'Chad', 'Somalia',
  'Guinea', 'Rwanda', 'Benin', 'Burundi', 'Tunisia', 'Togo'
]

export function CampaignWizard({ onSubmit, submitting = false, expertiseFields = [] }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CampaignWizardData>({
    name: '',
    description: '',
    objective: '',
    targetCountries: [],
    targetDemo: {},
    questions: [],
    needsQuestionDesign: false,
    urgency: 'standard',
  })
  const [pricing, setPricing] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)

  const updateFormData = (updates: Partial<CampaignWizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    if (currentStep === 3) {
      // Calculate pricing before moving to step 4
      await calculatePricing()
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculatePricing = async () => {
    if (formData.questions.length === 0 && !formData.needsQuestionDesign) {
      return
    }

    setLoadingPricing(true)
    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: formData.questions.map(q => ({
            questionType: q.questionType,
            complexityLevel: q.complexityLevel,
            requiredResponses: q.requiredResponses,
          })),
          urgency: formData.urgency,
          targetCountries: formData.targetCountries,
          demographicFilterCount: Object.keys(formData.targetDemo).length,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPricing(data.pricing)
      }
    } catch (error) {
      console.error('Error calculating pricing:', error)
    } finally {
      setLoadingPricing(false)
    }
  }

  const handleSubmit = async () => {
    await onSubmit(formData)
  }

  const addQuestion = () => {
    updateFormData({
      questions: [
        ...formData.questions,
        {
          questionType: 'open_text',
          complexityLevel: 'easy',
          requiredResponses: 10,
        },
      ],
    })
  }

  const removeQuestion = (index: number) => {
    updateFormData({
      questions: formData.questions.filter((_, i) => i !== index),
    })
  }

  const updateQuestion = (index: number, updates: Partial<CampaignWizardData['questions'][0]>) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    updateFormData({ questions: newQuestions })
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-xs text-center max-w-[100px]">
                <div className="font-medium">{step.title}</div>
                <div className="text-muted-foreground hidden sm:block">{step.description}</div>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="e.g., South African Consumer Preferences 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Brief description of the campaign..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective *</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => updateFormData({ objective: e.target.value })}
                  placeholder="What are you trying to learn or validate?"
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {/* Step 2: Target Audience */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label>Target Countries *</Label>
                <div className="flex flex-wrap gap-2">
                  {AFRICAN_COUNTRIES.map((country) => (
                    <Badge
                      key={country}
                      variant={formData.targetCountries.includes(country) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const newCountries = formData.targetCountries.includes(country)
                          ? formData.targetCountries.filter(c => c !== country)
                          : [...formData.targetCountries, country]
                        updateFormData({ targetCountries: newCountries })
                      }}
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
                {formData.targetCountries.length === 0 && (
                  <Alert>
                    <AlertDescription>Please select at least one target country</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label>Demographic Filters (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageMin">Min Age</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      value={formData.targetDemo.ageMin || ''}
                      onChange={(e) =>
                        updateFormData({
                          targetDemo: { ...formData.targetDemo, ageMin: e.target.value ? parseInt(e.target.value) : undefined },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageMax">Max Age</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      value={formData.targetDemo.ageMax || ''}
                      onChange={(e) =>
                        updateFormData({
                          targetDemo: { ...formData.targetDemo, ageMax: e.target.value ? parseInt(e.target.value) : undefined },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Questions */}
          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Questions</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateFormData({ needsQuestionDesign: !formData.needsQuestionDesign })}
                    >
                      {formData.needsQuestionDesign ? 'I will upload questions' : 'Request TruAfrica to design questions'}
                    </Button>
                    {!formData.needsQuestionDesign && (
                      <Button type="button" variant="outline" onClick={addQuestion}>
                        Add Question
                      </Button>
                    )}
                  </div>
                </div>

                {formData.needsQuestionDesign ? (
                  <Alert>
                    <AlertDescription>
                      TruAfrica will design questions based on your campaign brief. You can review and approve them before launch.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {formData.questions.length === 0 ? (
                      <Alert>
                        <AlertDescription>Add at least one question to continue</AlertDescription>
                      </Alert>
                    ) : (
                      formData.questions.map((question, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <h4 className="font-medium">Question {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                  value={question.questionType}
                                  onValueChange={(value) =>
                                    updateQuestion(index, { questionType: value as QuestionType })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open_text">Open Text</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Complexity</Label>
                                <Select
                                  value={question.complexityLevel}
                                  onValueChange={(value) =>
                                    updateQuestion(index, { complexityLevel: value as DifficultyLevel })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {expertiseFields.length > 0 && (
                              <div className="space-y-2">
                                <Label>Expertise Field</Label>
                                <Select
                                  value={question.fieldId || ''}
                                  onValueChange={(value) => updateQuestion(index, { fieldId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {expertiseFields.map((field) => (
                                      <SelectItem key={field.id} value={field.id}>
                                        {field.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Question Content</Label>
                              <Textarea
                                value={question.content || ''}
                                onChange={(e) => updateQuestion(index, { content: e.target.value })}
                                placeholder="Enter your question..."
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Required Responses</Label>
                              <Input
                                type="number"
                                value={question.requiredResponses}
                                onChange={(e) =>
                                  updateQuestion(index, { requiredResponses: parseInt(e.target.value) || 10 })
                                }
                                min={1}
                              />
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Step 4: Pricing Review */}
          {currentStep === 4 && (
            <>
              {loadingPricing ? (
                <div className="text-center py-8">Calculating pricing...</div>
              ) : pricing ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => {
                        updateFormData({ urgency: value as 'standard' | 'express' })
                        calculatePricing()
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express (+30% cost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${pricing.totalCost.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold gradient-text">${pricing.totalRevenue.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Margin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${pricing.marginPercentage >= 30 ? 'text-green-500' : 'text-yellow-500'}`}>
                          {pricing.marginPercentage.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {pricing.validation && (
                    <Alert variant={pricing.validation.isValid ? 'default' : 'destructive'}>
                      <AlertDescription>{pricing.validation.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Breakdown</Label>
                    <div className="space-y-2">
                      {pricing.breakdown.map((item: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{item.questionType} - {item.complexityLevel}</div>
                              <div className="text-sm text-muted-foreground">{item.requiredResponses} responses</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.totalPrice.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">${item.totalCost.toFixed(2)} cost</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>Unable to calculate pricing. Please check your questions configuration.</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.objective)) ||
                  (currentStep === 2 && formData.targetCountries.length === 0) ||
                  (currentStep === 3 && !formData.needsQuestionDesign && formData.questions.length === 0)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !pricing}
                variant="gradient"
              >
                {submitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


