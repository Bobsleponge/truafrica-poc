import { create } from 'zustand'
import type {
  BranchingState,
  CampaignJourneyData,
  CampaignJourneyMode,
  CampaignJourneyStepKey,
  GoalModality,
} from '@/types/campaign-journey'
import { evaluateBranching } from '@/lib/campaign/branching'

const STEP_SEQUENCE: CampaignJourneyStepKey[] = [
  'overview',
  'goals',
  'audience',
  'questions',
  'rewards',
  'scale',
  'pricing',
  'summary',
]

const defaultBranchingState: BranchingState = {
  showRegion: false,
  showLanguages: false,
  disableAgeCustomRange: true,
  requireNetwork: false,
  autoLoadedRegions: [],
  shouldShowQuestionBuilder: true,
  shouldShowPricing: true,
  preferredQuestionTypes: [],
  disabledQuestionTypes: [],
  rewardSuggestionRange: { min: 0.5, max: 5 },
}

export const createEmptyCampaignJourney = (): CampaignJourneyData => ({
  overview: {
    campaignName: '',
    companyName: '',
    industry: '',
    oneLineObjective: '',
    internalOwner: '',
  },
  goals: {
    primaryGoal: undefined,
    secondaryGoals: [],
    truafricaBuildsQuestions: false,
    modalityDetails: {
      behaviour: {},
      reasoning: {},
      audio: {},
      image: {},
      validation: {},
      fine_tuning: {},
    },
  },
  audience: {
    country: '',
    region: '',
    ageRange: { preset: undefined },
    languages: [],
    localePreference: 'none',
    estimatedVolume: undefined,
  },
  questions: [],
  rewards: {
    computedPointsPerQuestion: 0,
    computedPointsPerRespondent: 0,
    computedTotalPoints: 0,
    // Legacy fields
    rewardType: undefined,
    currency: undefined,
    fairnessMode: 'balanced',
    customValue: undefined,
    network: '',
    computedRewardPerQuestion: 0,
    computedRewardPerRespondent: 0,
    computedTotalBudget: 0,
  },
  scale: {
    respondents: 100,
    quotas: {},
    timeframe: {},
    validationStrictness: 'medium',
    autoGeoVerification: true,
    autoDuplicateDetection: true,
    aiQualityScoring: true,
    autoDisqualification: true,
  },
  pricing: {
    hidePricing: false,
    breakdown: {
      setupFee: 0,
      perResponseFee: 0,
      rewardBudget: 0,
      validationFee: 0,
      analyticsFee: 0,
      fineTuningFee: 0,
      internalMargin: 0,
      recommendedDiscount: 0,
      total: 0,
    },
    notes: '',
  },
})

type AutoSaveStatus = 'idle' | 'saving' | 'success' | 'error'

interface CampaignBuilderStoreState {
  campaignId?: string
  mode: CampaignJourneyMode
  campaign: CampaignJourneyData
  currentStep: CampaignJourneyStepKey
  branching: BranchingState
  autoSaveStatus: AutoSaveStatus
  autoSaveError?: string
  lastSavedAt?: string
  hydrate: (payload: { campaignId?: string; data?: Partial<CampaignJourneyData>; mode?: CampaignJourneyMode }) => void
  setField: <K extends keyof CampaignJourneyData>(step: K, field: string, value: unknown) => void
  setCurrentStep: (step: CampaignJourneyStepKey) => void
  setPrimaryGoal: (goal: GoalModality | undefined) => void
  applyBranching: () => void
  scheduleAutoSave: () => void
  autoSave: () => Promise<void>
  reset: () => void
}

let autoSaveTimer: NodeJS.Timeout | null = null

export const useCampaignBuilderStore = create<CampaignBuilderStoreState>((set, get) => ({
  campaignId: undefined,
  mode: 'client',
  campaign: createEmptyCampaignJourney(),
  currentStep: 'overview',
  branching: defaultBranchingState,
  autoSaveStatus: 'idle',
  autoSaveError: undefined,
  lastSavedAt: undefined,

  hydrate: ({ campaignId, data, mode }) => {
    const base = createEmptyCampaignJourney()
    const resolvedMode = mode || 'client'

    const pricing = {
      ...base.pricing,
      ...data?.pricing,
      hidePricing: resolvedMode === 'internal' ? true : Boolean(data?.pricing?.hidePricing),
      breakdown: {
        ...base.pricing.breakdown,
        ...data?.pricing?.breakdown,
      },
    }

    const hydrated: CampaignJourneyData = {
      ...base,
      ...data,
      overview: { ...base.overview, ...data?.overview },
      goals: {
        ...base.goals,
        ...data?.goals,
        modalityDetails: {
          ...base.goals.modalityDetails,
          ...data?.goals?.modalityDetails,
        },
      },
      audience: {
        ...base.audience,
        ...data?.audience,
      },
      rewards: {
        ...base.rewards,
        ...data?.rewards,
      },
      scale: { ...base.scale, ...data?.scale },
      pricing,
    }

    const branching = evaluateBranching(hydrated, defaultBranchingState, resolvedMode)

    set({
      campaignId,
      mode: resolvedMode,
      campaign: hydrated,
      branching,
    })
  },

  setField: <K extends keyof CampaignJourneyData>(step: K, field: string, value: unknown) => {
    set((state) => {
      const updated = { ...state.campaign }

      if (step === 'questions') {
        updated.questions = Array.isArray(value) ? value : []
      } else if (step in updated) {
        const currentStepValue = { ...(updated[step] as Record<string, unknown>) }
        currentStepValue[field] = value
        ;(updated as CampaignJourneyData)[step] = currentStepValue as CampaignJourneyData[K]
      }

      return { campaign: updated }
    })

    get().applyBranching()
    get().scheduleAutoSave()
  },

  setPrimaryGoal: (goal) => {
    set((state) => ({
      campaign: {
        ...state.campaign,
        goals: {
          ...state.campaign.goals,
          primaryGoal: goal,
        },
      },
    }))
    get().applyBranching()
    get().scheduleAutoSave()
  },


  setCurrentStep: (step) => {
    if (!STEP_SEQUENCE.includes(step)) return
    set({ currentStep: step })
  },

  applyBranching: () => {
    const { campaign } = get()
    const newBranching = evaluateBranching(campaign, get().branching, get().mode)
    set({ branching: newBranching })
  },

  scheduleAutoSave: () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(() => {
      get().autoSave().catch((error) => {
        console.error('Auto-save failed', error)
      })
    }, 900)
  },

  autoSave: async () => {
    const { campaignId, currentStep, campaign } = get()
    if (!campaignId) {
      return
    }

    set({ autoSaveStatus: 'saving', autoSaveError: undefined })

    try {
      const response = await fetch('/api/campaigns/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          step: currentStep,
          data: campaign,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to auto-save campaign')
      }

      set({
        autoSaveStatus: 'success',
        lastSavedAt: new Date().toISOString(),
      })
    } catch (error: any) {
      set({
        autoSaveStatus: 'error',
        autoSaveError: error?.message || 'Unknown error',
      })
    }
  },

  reset: () => {
    set({
      campaign: createEmptyCampaignJourney(),
      currentStep: 'overview',
      branching: defaultBranchingState,
      autoSaveStatus: 'idle',
      autoSaveError: undefined,
      lastSavedAt: undefined,
    })
  },
}))

export const getStepIndex = (step: CampaignJourneyStepKey) => STEP_SEQUENCE.indexOf(step)
export const getStepKeyByIndex = (index: number): CampaignJourneyStepKey =>
  STEP_SEQUENCE[index] || 'overview'

