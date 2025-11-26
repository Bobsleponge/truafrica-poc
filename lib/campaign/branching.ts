import type {
  BranchingState,
  CampaignAudience,
  CampaignJourneyData,
  CampaignJourneyMode,
  GoalModality,
  QuestionKind,
} from '@/types/campaign-journey'

const COUNTRY_REGION_MAP: Record<string, string[]> = {
  Kenya: [
    'Nairobi',
    'Mombasa',
    'Kisumu',
    'Nakuru',
    'Uasin Gishu',
    'Kiambu',
    'Kericho',
    'Machakos',
  ],
  'South Africa': [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ],
  Nigeria: [
    'Lagos',
    'Abuja',
    'Kano',
    'Kaduna',
    'Rivers',
    'Oyo',
    'Anambra',
    'Ogun',
  ],
  Ghana: [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
  ],
  Uganda: [
    'Kampala',
    'Wakiso',
    'Mukono',
    'Jinja',
    'Mbale',
    'Gulu',
    'Mbarara',
    'Masaka',
  ],
}

const MODALITY_TO_QUESTION_TYPES: Record<GoalModality, QuestionKind[]> = {
  behaviour: ['mcq', 'single_choice', 'rating', 'short_text'],
  reasoning: ['long_text', 'short_text', 'mcq'],
  audio: ['audio', 'short_text', 'rating'],
  image: ['image', 'short_text', 'mcq'],
  validation: ['mcq', 'rating', 'single_choice'],
  fine_tuning: ['long_text', 'short_text', 'mcq', 'image', 'audio'],
}

export const getRegionsForCountry = (country?: string) => {
  if (!country) return []
  return COUNTRY_REGION_MAP[country] || []
}

export const evaluateBranching = (
  campaign: CampaignJourneyData,
  previous: BranchingState,
  mode: CampaignJourneyMode = 'client'
): BranchingState => {
  const { goals, audience, rewards, pricing } = campaign
  const primaryGoal = goals.primaryGoal

  // Show region field for specific goal types that benefit from geographic targeting
  // Note: Original plan mentioned 'retail', 'consumer_behaviour', 'climate', 'agriculture', 'transportation'
  // Mapping to actual GoalModality types: 'behaviour' covers consumer behaviour, 'validation' for quality control
  const showRegion = primaryGoal
    ? ['behaviour', 'validation'].includes(primaryGoal)
    : false

  // Show languages field for specific goal types
  const showLanguages = primaryGoal
    ? ['audio', 'reasoning'].includes(primaryGoal)
    : false

  // Disable custom age range inputs when not using custom preset
  const disableAgeCustomRange = audience.ageRange?.preset !== 'custom'

  const requireNetwork = rewards.rewardType === 'airtime'
  const autoLoadedRegions = getRegionsForCountry(audience.country)
  const shouldShowQuestionBuilder = !goals.truafricaBuildsQuestions
  const shouldShowPricing = mode !== 'internal' && !pricing.hidePricing

  const preferredQuestionTypes: QuestionKind[] = primaryGoal
    ? MODALITY_TO_QUESTION_TYPES[primaryGoal]
    : previous.preferredQuestionTypes

  const disabledQuestionTypes: QuestionKind[] = []
  if (primaryGoal === 'image') {
    disabledQuestionTypes.push('audio')
  }
  if (primaryGoal === 'audio') {
    disabledQuestionTypes.push('image')
  }

  // Standard points system - no fairness mode needed
  const rewardSuggestionRange = { min: 0.5, max: 5 }

  return {
    showRegion,
    showLanguages,
    disableAgeCustomRange,
    requireNetwork,
    autoLoadedRegions,
    shouldShowQuestionBuilder,
    shouldShowPricing,
    preferredQuestionTypes,
    disabledQuestionTypes,
    rewardSuggestionRange,
  }
}


