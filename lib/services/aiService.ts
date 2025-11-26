/**
 * AI Service - OpenAI Integration
 * Handles all AI-powered features for the campaign builder
 * Supports primary and backup API keys with automatic fallback
 */

import { randomUUID } from 'crypto'
import OpenAI from 'openai'
import type { CampaignQuestion, CampaignOverview, CampaignGoals, CampaignAudience } from '@/types/campaign-journey'

// Primary API key - must be set via environment variable
const OPENAI_API_KEY_PRIMARY = process.env.OPENAI_API_KEY_PRIMARY

// Backup API key (current/legacy) - from OPENAI_API_KEY environment variable
const OPENAI_API_KEY_BACKUP = process.env.OPENAI_API_KEY

// Initialize OpenAI clients
let openaiPrimary: OpenAI | null = null
let openaiBackup: OpenAI | null = null

if (OPENAI_API_KEY_PRIMARY) {
  openaiPrimary = new OpenAI({
    apiKey: OPENAI_API_KEY_PRIMARY,
  })
}

if (OPENAI_API_KEY_BACKUP) {
  openaiBackup = new OpenAI({
    apiKey: OPENAI_API_KEY_BACKUP,
  })
}

interface AIServiceOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  options: AIServiceOptions = {}
): Promise<string> {
  // Check if any API key is configured
  if (!openaiPrimary && !openaiBackup) {
    console.warn('OpenAI API key not configured, returning placeholder response')
    return 'AI service not configured. Please set OPENAI_API_KEY_PRIMARY or OPENAI_API_KEY environment variable.'
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  messages.push({ role: 'user', content: prompt })

  const requestConfig = {
    model: options.model || 'gpt-4',
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
  }

  // Try primary API key first
  if (openaiPrimary) {
    try {
      const response = await openaiPrimary.chat.completions.create(requestConfig)
      return response.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.warn('Primary OpenAI API key failed, trying backup:', error.message)
      
      // If it's a rate limit or temporary error, try backup
      // If it's an auth error, don't try backup (key is invalid)
      if (error.status === 401) {
        console.error('Primary OpenAI API key is invalid')
        // Still try backup in case primary key is wrong but backup is valid
      } else if (error.status === 429 || error.status === 500 || error.status === 503) {
        console.log('Primary API key rate limited or server error, falling back to backup')
      }
      
      // Fall through to try backup
    }
  }

  // Try backup API key if primary failed or doesn't exist
  if (openaiBackup) {
    try {
      const response = await openaiBackup.chat.completions.create(requestConfig)
      console.log('Successfully used backup OpenAI API key')
      return response.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('Backup OpenAI API also failed:', error)
      
      // Provide helpful error messages
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY_PRIMARY and OPENAI_API_KEY environment variables.')
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded on both primary and backup keys. Please try again later.')
      } else if (error.status === 500) {
        throw new Error('OpenAI API server error. Please try again later.')
      }
      
      throw new Error(`AI service error: ${error.message || 'Unknown error'}`)
    }
  }

  // If we get here, both keys failed or don't exist
  throw new Error('No valid OpenAI API keys configured. Please set OPENAI_API_KEY_PRIMARY or OPENAI_API_KEY environment variable.')
}

/**
 * Optimize questions based on campaign objectives
 */
export async function optimizeQuestions(
  campaignData: any,
  questions: any[]
): Promise<{ suggestions: string[]; optimizedQuestions: any[] }> {
  const prompt = `You are an expert survey designer. Analyze these campaign questions and provide optimization suggestions.

Campaign Context:
- Primary Goal: ${campaignData.primaryGoal}
- Use Case: ${campaignData.useCaseDescription}
- Target Audience: ${campaignData.targetCountries?.join(', ')}
- Industry: ${campaignData.industry}

Questions:
${questions.map((q, i) => `${i + 1}. ${q.content} (Type: ${q.questionType})`).join('\n')}

Provide:
1. 3-5 specific suggestions to improve question clarity, bias reduction, and effectiveness
2. Optimized versions of questions that need improvement

Format your response as JSON:
{
  "suggestions": ["suggestion1", "suggestion2", ...],
  "optimizedQuestions": [{"index": 0, "original": "...", "optimized": "...", "reason": "..."}]
}`

  const systemPrompt = 'You are a survey design expert specializing in African market research and AI data collection.'

  try {
    const response = await callOpenAI(prompt, systemPrompt, { maxTokens: 2000 })
    const parsed = JSON.parse(response)
    return {
      suggestions: parsed.suggestions || [],
      optimizedQuestions: parsed.optimizedQuestions || [],
    }
  } catch (error) {
    return {
      suggestions: ['Review questions for clarity and cultural sensitivity', 'Ensure questions align with campaign objectives'],
      optimizedQuestions: [],
    }
  }
}

/**
 * Recommend campaign scope based on objectives
 */
export async function recommendScope(campaignData: any): Promise<string> {
  const prompt = `Analyze this campaign brief and recommend the optimal scope:

Company: ${campaignData.companyName}
Industry: ${campaignData.industry}
Primary Goal: ${campaignData.primaryGoal}
Use Case: ${campaignData.useCaseDescription}
Target Countries: ${campaignData.targetCountries?.join(', ')}
Data Modality: ${campaignData.dataModality?.join(', ')}

Provide recommendations for:
1. Optimal number of respondents
2. Question count and types
3. Timeline recommendations
4. Budget considerations
5. Quality control requirements`

  const systemPrompt = 'You are a data collection strategy expert for African markets.'

  return callOpenAI(prompt, systemPrompt, { maxTokens: 1500 })
}

/**
 * Suggest pricing based on campaign parameters
 */
export async function suggestPricing(campaignData: any): Promise<string> {
  const prompt = `Based on this campaign configuration, suggest appropriate pricing:

- Number of Respondents: ${campaignData.numberOfRespondents}
- Number of Questions: ${campaignData.questions?.length || 0}
- Question Types: ${campaignData.questions?.map((q: any) => q.questionType).join(', ') || 'N/A'}
- Target Countries: ${campaignData.targetCountries?.join(', ')}
- Urgency: ${campaignData.preferredTimelines?.urgency || 'standard'}
- Quality Requirements: ${JSON.stringify(campaignData.qualityRules)}

Provide pricing recommendations including:
1. Setup fee range
2. Per-response fee range
3. Total budget estimate
4. Margin recommendations
5. Discount suggestions for large campaigns`

  const systemPrompt = 'You are a pricing strategist for data collection services in African markets.'

  return callOpenAI(prompt, systemPrompt, { maxTokens: 1000 })
}

/**
 * Analyze operational risks
 */
export async function analyzeRisks(campaignData: any): Promise<{ risks: string[]; mitigations: string[] }> {
  const prompt = `Analyze this campaign for potential operational risks:

- Target Countries: ${campaignData.targetCountries?.join(', ')}
- Number of Respondents: ${campaignData.numberOfRespondents}
- Question Types: ${campaignData.questions?.map((q: any) => q.questionType).join(', ')}
- Languages: ${campaignData.languages?.join(', ')}
- Timeline: ${campaignData.preferredTimelines?.estimatedDuration}
- Quality Rules: ${JSON.stringify(campaignData.qualityRules)}

Identify:
1. Top 5 operational risks
2. Recommended mitigations for each risk

Format as JSON:
{
  "risks": ["risk1", "risk2", ...],
  "mitigations": ["mitigation1", "mitigation2", ...]
}`

  const systemPrompt = 'You are a risk management expert for data collection operations in Africa.'

  try {
    const response = await callOpenAI(prompt, systemPrompt, { maxTokens: 1500 })
    const parsed = JSON.parse(response)
    return {
      risks: parsed.risks || [],
      mitigations: parsed.mitigations || [],
    }
  } catch (error) {
    return {
      risks: ['Low response rates', 'Language barriers', 'Technical issues', 'Quality control challenges'],
      mitigations: ['Incentivize participation', 'Provide multilingual support', 'Test technical infrastructure', 'Implement robust QA'],
    }
  }
}

/**
 * Detect bias in questions
 */
export async function detectBias(questions: any[]): Promise<{ biasedQuestions: any[]; suggestions: string[] }> {
  const prompt = `Analyze these survey questions for potential bias (cultural, gender, socioeconomic, etc.):

${questions.map((q, i) => `${i + 1}. ${q.content} (Type: ${q.questionType})`).join('\n')}

Identify:
1. Questions with potential bias
2. Type of bias (cultural, gender, socioeconomic, etc.)
3. Suggestions to make questions more neutral and inclusive

Format as JSON:
{
  "biasedQuestions": [{"index": 0, "biasType": "...", "suggestion": "..."}],
  "suggestions": ["general suggestion1", "general suggestion2", ...]
}`

  const systemPrompt = 'You are an expert in survey design and bias detection, specializing in African cultural contexts.'

  try {
    const response = await callOpenAI(prompt, systemPrompt, { maxTokens: 2000 })
    const parsed = JSON.parse(response)
    return {
      biasedQuestions: parsed.biasedQuestions || [],
      suggestions: parsed.suggestions || [],
    }
  } catch (error) {
    return {
      biasedQuestions: [],
      suggestions: ['Review questions for cultural sensitivity', 'Ensure inclusive language'],
    }
  }
}

/**
 * Check POPIA/GDPR compliance
 */
export async function checkCompliance(campaignData: any): Promise<{ compliant: boolean; issues: string[]; recommendations: string[] }> {
  const prompt = `Check this campaign for POPIA (South Africa) and GDPR compliance:

- Data Sensitivity: ${campaignData.dataSensitivityLevel}
- NDA Status: ${campaignData.ndaStatus ? 'Signed' : 'Not signed'}
- Target Countries: ${campaignData.targetCountries?.join(', ')}
- Data Collection: ${campaignData.dataModality?.join(', ')}
- Exclusions: ${campaignData.exclusions?.join(', ') || 'None'}

Identify:
1. Compliance issues
2. Recommendations to ensure full compliance

Format as JSON:
{
  "compliant": true/false,
  "issues": ["issue1", "issue2", ...],
  "recommendations": ["rec1", "rec2", ...]
}`

  const systemPrompt = 'You are a data protection and privacy compliance expert specializing in POPIA and GDPR.'

  try {
    const response = await callOpenAI(prompt, systemPrompt, { maxTokens: 1500 })
    const parsed = JSON.parse(response)
    return {
      compliant: parsed.compliant !== false,
      issues: parsed.issues || [],
      recommendations: parsed.recommendations || [],
    }
  } catch (error) {
    return {
      compliant: true,
      issues: [],
      recommendations: ['Ensure proper consent mechanisms', 'Implement data retention policies'],
    }
  }
}

/**
 * Generate campaign summary
 */
export async function generateSummary(campaignData: any): Promise<string> {
  const prompt = `Generate a comprehensive, professional campaign summary for this data collection campaign:

Company: ${campaignData.companyName}
Industry: ${campaignData.industry}
Primary Goal: ${campaignData.primaryGoal}
Secondary Goals: ${campaignData.secondaryGoals?.join(', ')}
Use Case: ${campaignData.useCaseDescription}
Target Countries: ${campaignData.targetCountries?.join(', ')}
Number of Respondents: ${campaignData.numberOfRespondents}
Questions: ${campaignData.questions?.length || 0}
Total Budget: $${campaignData.pricing?.totalPrice?.toFixed(2) || '0.00'}

Create a 2-3 paragraph executive summary that:
1. Describes the campaign objectives
2. Outlines the methodology
3. Highlights key deliverables
4. Mentions timeline and scope`

  const systemPrompt = 'You are a professional business writer specializing in data collection and market research proposals.'

  return callOpenAI(prompt, systemPrompt, { maxTokens: 1000 })
}

const mapGeneratedQuestionType = (type?: string): CampaignQuestion['type'] => {
  const normalized = (type || '').toLowerCase()
  switch (normalized) {
    case 'multiple_choice':
    case 'mcq':
      return 'mcq'
    case 'single_choice':
      return 'single_choice'
    case 'long_text':
      return 'long_text'
    case 'rating':
      return 'rating'
    case 'audio':
      return 'audio'
    case 'image':
    case 'image_upload':
      return 'image'
    case 'video':
      return 'video'
    default:
      return 'short_text'
  }
}

interface QuestionGenerationParams {
  overview?: CampaignOverview
  goals?: CampaignGoals
  audience?: CampaignAudience
  existingQuestions?: CampaignQuestion[]
  count?: number
}

interface GeneratedQuestionResponse {
  title: string
  description?: string
  type?: string
  options?: string[]
  reward?: number
  complexity?: CampaignQuestion['complexity']
  required?: boolean
}

export async function generateCampaignQuestions(
  params: QuestionGenerationParams
): Promise<CampaignQuestion[]> {
  const { overview, goals, audience, existingQuestions = [], count = 6 } = params

  // Build comprehensive campaign context
  const campaignName = overview?.campaignName || 'Unnamed Campaign'
  const companyName = overview?.companyName || 'Client Company'
  const industry = overview?.industry || 'General'
  const objective = overview?.oneLineObjective || 'Collect research insights'
  
  const primaryGoal = goals?.primaryGoal || 'General insights'
  const secondaryGoals = goals?.secondaryGoals || []
  const modalityDetails = goals?.modalityDetails?.[primaryGoal] || {}
  const datasetDescription = modalityDetails?.datasetDescription || ''
  const inputs = modalityDetails?.inputs || []
  const outputs = modalityDetails?.outputs || []
  const validationNeeds = modalityDetails?.validationNeeds || ''

  const country = audience?.country || 'Multi-market'
  const region = audience?.region || ''
  const ageRange = audience?.ageRange
  const languages = audience?.languages || []
  const localePreference = audience?.localePreference || 'none'
  const estimatedVolume = audience?.estimatedVolume || 'medium'

  // Build age range description
  let ageDescription = 'All ages'
  if (ageRange?.preset) {
    if (ageRange.preset === 'all_adults') {
      ageDescription = 'All adults'
    } else if (ageRange.preset === 'custom' && (ageRange.min || ageRange.max)) {
      const min = ageRange.min || 0
      const max = ageRange.max || 100
      ageDescription = `${min}-${max} years`
    } else if (ageRange.preset !== 'custom') {
      // Use preset labels
      const presetLabels: Record<string, string> = {
        '18_24': '18-24 years',
        '25_34': '25-34 years',
        '35_44': '35-44 years',
        '45_plus': '45+ years',
      }
      ageDescription = presetLabels[ageRange.preset] || 'All ages'
    }
  } else if (ageRange?.min || ageRange?.max) {
    // Fallback for custom ranges without preset
    const min = ageRange.min || 0
    const max = ageRange.max || 100
    ageDescription = `${min}-${max} years`
  }

  // Build existing questions list for prompt
  const existingQuestionsList = existingQuestions.length > 0
    ? existingQuestions.map((q, idx) => `${idx + 1}. "${q.title}"${q.description ? ` - ${q.description}` : ''} (Type: ${q.type})`).join('\n')
    : 'None'

  const prompt = `You are TruAfrica's elite campaign designer specializing in African market research and AI data collection. Your task is to design ${count} NEW, UNIQUE, high-impact, culturally-sensitive research questions that directly address the campaign's specific objectives and target audience.

## CAMPAIGN OVERVIEW
**Campaign Name:** ${campaignName}
**Company:** ${companyName}
**Industry:** ${industry}
**Primary Objective:** ${objective}

## CAMPAIGN GOALS & BLUEPRINT (CRITICAL - USE THIS DATA)
**Primary Goal:** ${primaryGoal}
${secondaryGoals.length > 0 ? `**Secondary Goals:** ${secondaryGoals.join(', ')}` : ''}

**📋 DATASET DESCRIPTION (BLUEPRINT):** ${datasetDescription || 'Not specified - this is the core data requirement'}
${inputs.length > 0 ? `**📥 INPUTS/STIMULI (BLUEPRINT):** ${Array.isArray(inputs) ? inputs.join(', ') : inputs}` : ''}
${outputs.length > 0 ? `**📤 EXPECTED OUTPUTS (BLUEPRINT):** ${Array.isArray(outputs) ? outputs.join(', ') : outputs}` : ''}
${validationNeeds ? `**✅ VALIDATION NEEDS (BLUEPRINT):** ${validationNeeds}` : ''}

## TARGET AUDIENCE
**Country:** ${country}
${region ? `**Region:** ${region}` : ''}
**Locale Preference:** ${localePreference === 'none' ? 'No preference' : localePreference}
**Age Range:** ${ageDescription}
**Estimated Volume:** ${estimatedVolume}
${languages.length > 0 ? `**Languages:** ${languages.join(', ')}` : ''}

## ⚠️ EXISTING QUESTIONS (DO NOT REPEAT - GENERATE DIFFERENT ONES)
${existingQuestions.length > 0 ? `The following questions already exist. You MUST generate completely different questions that cover different angles, topics, or aspects:\n\n${existingQuestionsList}\n\n` : 'No existing questions. Generate fresh questions.'}

## YOUR TASK
Generate ${count} NEW research questions that are:
1. **COMPLETELY DIFFERENT** from the existing questions listed above (if any)
2. **Directly address the campaign objective:** "${objective}"
3. **Align with the primary goal modality:** ${primaryGoal}
4. **Are culturally appropriate** for ${country}${region ? `, specifically ${region}` : ''}
5. **Consider the target demographics:** ${ageDescription}${localePreference !== 'none' ? `, ${localePreference} locale` : ''}
6. **Leverage the BLUEPRINT data requirements:** ${datasetDescription ? `Focus on ${datasetDescription}` : 'Use the modality details provided'}
   ${inputs.length > 0 ? `- Consider what inputs/stimuli will be provided: ${Array.isArray(inputs) ? inputs.join(', ') : inputs}` : ''}
   ${outputs.length > 0 ? `- Ensure outputs match requirements: ${Array.isArray(outputs) ? outputs.join(', ') : outputs}` : ''}
7. **Are relevant to the industry:** ${industry}
8. **Show VARIETY** - use different question types, angles, and focus areas

Each question should be:
- **Unique and non-repetitive** - different from existing questions in topic, angle, or approach
- **Specific and actionable** - directly tied to the campaign's research goals
- **Culturally sensitive** - appropriate for African markets and the target locale
- **Clear and unambiguous** - easy for respondents to understand
- **Aligned with the modality** - suitable for ${primaryGoal} data collection
- **Varied in type** - mix different question types (mcq, single_choice, short_text, long_text, rating, etc.)

IMPORTANT: Ensure maximum variety - avoid similar questions, explore different aspects of the campaign objective, and use diverse question types.

Respond with JSON:
{
  "questions": [
    {
      "title": "Question title (specific to the campaign objective, DIFFERENT from existing ones)",
      "description": "Why we ask this - explain how it directly addresses the campaign goal and differs from existing questions",
      "type": "mcq|single_choice|short_text|long_text|rating|audio|image|video",
      "options": [],
      "reward": 1.5,
      "complexity": "simple|balanced|complex",
      "required": true
    }
  ]
}`

  try {
    // Use higher temperature to encourage variety and avoid repetition
    const response = await callOpenAI(prompt, "You are TruAfrica's elite campaign designer specializing in diverse, non-repetitive question generation.", {
      maxTokens: 2000,
      temperature: 0.85, // Higher temperature for more variety
    })
    const parsed = JSON.parse(response)
    const questions = Array.isArray(parsed.questions)
      ? (parsed.questions as GeneratedQuestionResponse[])
      : []
    return questions.map((question) => ({
      id: randomUUID(),
      title: question.title,
      description: question.description,
      type: mapGeneratedQuestionType(question.type),
      options: question.options,
      reward: question.reward,
      complexity: question.complexity,
      required: question.required !== false,
    }))
  } catch (error) {
    console.warn('AI question generation fallback', error)
    return [
      {
        id: randomUUID(),
        title: 'Describe your current workflow challenges',
        description: 'Understand baseline inefficiencies for AI optimization.',
        type: 'long_text',
        options: [],
        reward: 1.2,
        complexity: 'balanced',
        required: true,
      },
    ]
  }
}

