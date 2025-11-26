# Step 3: Target Audience - Comprehensive Breakdown

## Overview

Step 3 in the Campaign Builder is the **"Target Audience"** step (also referred to as "Audience" in the codebase). This step is part of the 8-step Campaign Journey system and focuses on defining the geographic, demographic, and linguistic characteristics of the campaign's target respondents.

---

## Step Position in Wizard

**Step Sequence:**
1. Step 1: Overview
2. Step 2: Goals & Use Case
3. **Step 3: Target Audience** ← Current Step
4. Step 4: Questions
5. Step 5: Rewards & Incentives
6. Step 6: Scale & Quality
7. Step 7: Pricing & Commercials
8. Step 8: Summary & Export

**Step Key:** `'audience'`  
**Component:** `StepAudience.tsx`  
**Location:** `app/company/campaigns/builder/[id]/components/StepAudience.tsx`

---

## Data Structure

### TypeScript Interface

```typescript
interface CampaignAudience {
  country?: string                    // Primary target country
  region?: string                    // Region/Province within country
  subRegions: string[]              // Counties/Provinces (array)
  ageBracket?: {                     // Age range
    min?: number
    max?: number
  }
  languageProfiles: AudienceLanguageProfile[]  // Languages and dialects
  localeType?: 'urban' | 'rural' | 'mixed'    // Urban/rural preference
  groupSizeExpectation?: 'small' | 'medium' | 'large'  // Expected respondent count
}
```

### Language Profile Structure

```typescript
interface AudienceLanguageProfile {
  language: string                   // Primary language
  dialect?: string                   // Optional dialect variant
  rewardRecommendation?: number     // Reward boost for dialect (conditional)
}
```

---

## Component Implementation

### File Location
- **Component:** `app/company/campaigns/builder/[id]/components/StepAudience.tsx`
- **Store:** `store/useCampaignBuilderStore.ts`
- **Branching Logic:** `lib/campaign/branching.ts`
- **Types:** `types/campaign-journey.ts`

### Key Features

#### 1. **Country Selection**
- Dropdown with 5 African countries:
  - Kenya
  - South Africa
  - Nigeria
  - Ghana
  - Uganda
- Auto-populates regions when country is selected
- Clears region/sub-regions when country is deselected

#### 2. **Region/Province Management**
- Auto-populated based on selected country
- Uses `getRegionsForCountry()` function from branching logic
- Supports manual editing via textarea
- Region mapping:
  - **Kenya:** Nairobi, Mombasa, Kisumu, Nakuru, Uasin Gishu, Kiambu, Kericho, Machakos
  - **South Africa:** 9 provinces (Eastern Cape, Free State, Gauteng, etc.)
  - **Nigeria:** 8 states (Lagos, Abuja, Kano, Kaduna, etc.)

#### 3. **Locale Type Selection**
- Three options: `urban`, `rural`, `mixed`
- Button-based selection with visual feedback
- Affects campaign targeting and pricing

#### 4. **Age Bracket**
- Conditional display based on branching logic
- If `branching.shouldAskAgeDetails === false`:
  - Shows message: "All ages selected — skipping age-specific logic"
- If `branching.shouldAskAgeDetails === true`:
  - Shows min/max age inputs
  - Logic: `shouldAskAgeDetails = !isAllAges(audience)`
  - "All ages" = (min ≤ 0 or undefined) AND (max ≥ 65 or undefined)

#### 5. **Group Size Expectation**
- Dropdown with three options:
  - `small`: 200 - 500 respondents
  - `medium`: 500 - 2k respondents (default)
  - `large`: 2k+ respondents
- Affects pricing and campaign scale calculations

#### 6. **Sub-Regions (Counties/Provinces)**
- Multi-line textarea input
- One region per line
- Automatically parsed into array
- Auto-populated when country changes

#### 7. **Language & Dialect Profiles**
- Dynamic list of language profiles
- Each profile contains:
  - Language (required)
  - Dialect (optional)
  - Reward recommendation (conditional)
- **Add Language** button to add new profiles
- **Remove** button for each profile (when dialect reward not shown)

### Conditional Features (Branching Logic)

#### Dialect Reward Display
- **Condition:** `branching.showDialectReward === true`
- **Trigger:** When `languageProfiles.length > 1`
- **Behavior:**
  - Shows reward recommendation input for each profile
  - Hides remove button
  - Shows message: "Multiple languages detected — reward recommendations will adjust automatically."

#### Accent Support
- **Condition:** `branching.showAccentSupport === true`
- **Trigger:** 
  - Primary goal is `'audio'` OR
  - Any language profile has a dialect specified
- **Impact:** Affects question builder and validation settings

---

## State Management

### Zustand Store Integration

The component uses `useCampaignBuilderStore` for state management:

```typescript
const campaign = useCampaignBuilderStore((state) => state.campaign)
const setField = useCampaignBuilderStore((state) => state.setField)
const branching = useCampaignBuilderStore((state) => state.branching)
```

### Auto-Save Behavior

- **Trigger:** Any field change calls `setField()`
- **Debounce:** 900ms delay before auto-save
- **API Endpoint:** `POST /api/campaigns/builder`
- **Payload:** Full campaign data + current step

### Branching Logic Updates

When audience data changes:
1. `setField()` updates the store
2. `applyBranching()` is called automatically
3. `evaluateBranching()` recalculates:
   - `showAccentSupport`
   - `showDialectReward`
   - `shouldAskAgeDetails`
   - `autoLoadedRegions`
   - Other conditional features

---

## Branching Logic Details

### File: `lib/campaign/branching.ts`

#### Key Functions

**`getRegionsForCountry(country?: string): string[]`**
- Returns array of regions for a given country
- Uses `COUNTRY_REGION_MAP` lookup
- Returns empty array if country not found

**`evaluateBranching(campaign, previous, mode): BranchingState`**
- Evaluates all branching conditions based on campaign state
- Audience-specific evaluations:
  ```typescript
  const showAccentSupport = 
    primaryGoal === 'audio' || 
    audience.languageProfiles.some(lang => Boolean(lang.dialect))
  
  const showDialectReward = audience.languageProfiles.length > 1
  
  const autoLoadedRegions = getRegionsForCountry(audience.country)
  
  const shouldAskAgeDetails = !isAllAges(audience)
  ```

**`isAllAges(audience: CampaignAudience): boolean`**
- Checks if age bracket covers all ages
- Returns `true` if: (min ≤ 0 or undefined) AND (max ≥ 65 or undefined)

---

## UI/UX Features

### Visual Design
- Dark theme with white/10 borders
- Rounded corners (rounded-2xl, rounded-3xl)
- Gradient accents (fuchsia/indigo)
- Responsive grid layouts (md:grid-cols-2, md:grid-cols-3)

### Form Elements
- **Selects:** Custom styled dropdowns with dark background
- **Inputs:** Number inputs for age, text inputs for regions
- **Textarea:** Multi-line for sub-regions
- **Buttons:** Outline variant for actions, ghost for remove

### Conditional Messaging
- Success/info messages with emerald color scheme
- Warning messages with amber color scheme
- Contextual help text based on branching state

### Accessibility
- Proper label associations
- Semantic HTML structure
- Keyboard navigation support

---

## Data Flow

### Initialization
1. Component mounts
2. Reads current `campaign.audience` from store
3. Applies branching logic
4. Auto-populates regions if country selected

### User Interaction Flow
```
User selects country
  ↓
useEffect detects country change
  ↓
getRegionsForCountry() called
  ↓
setField('audience', 'subRegions', regions)
  ↓
applyBranching() triggered
  ↓
evaluateBranching() recalculates
  ↓
scheduleAutoSave() (900ms debounce)
  ↓
POST /api/campaigns/builder
```

### Validation
- No explicit validation in component
- Validation handled at API level
- Required fields enforced by UI (country selection)

---

## Integration Points

### With Other Steps

**Step 2 (Goals):**
- Primary goal affects `showAccentSupport`
- Modality affects question type recommendations

**Step 4 (Questions):**
- Language profiles affect question language options
- Dialect support affects question complexity
- Preferred question types filtered by modality

**Step 5 (Rewards):**
- Dialect reward recommendations feed into reward calculations
- Fairness mode affects reward ranges
- Currency selection based on country

**Step 6 (Scale):**
- Group size expectation affects respondent count
- Age bracket affects demographic quotas
- Country/region affects pricing multipliers

**Step 7 (Pricing):**
- Country selection affects cost multipliers
- Demographic filters add to pricing
- Language complexity affects validation costs

### API Endpoints

**Auto-Save:**
- `POST /api/campaigns/builder`
- Saves full campaign state including audience data

**Finalization:**
- `POST /api/campaigns/[id]/finalize`
- Uses audience data for campaign setup

---

## Default Values

When campaign is initialized:

```typescript
audience: {
  country: '',
  region: '',
  subRegions: [],
  ageBracket: { min: undefined, max: undefined },
  languageProfiles: [],
  localeType: 'mixed',
  groupSizeExpectation: 'medium',
}
```

---

## Edge Cases & Handling

### Country Changes
- **Behavior:** Clears region and sub-regions if country cleared
- **Auto-population:** Sets first region if none selected
- **Validation:** Resets region if not in new country's region list

### Age Bracket
- **All Ages:** If min ≤ 0 and max ≥ 65, hides age inputs
- **Empty:** Both undefined = all ages
- **Partial:** Only min or only max = partial range

### Language Profiles
- **Empty Array:** No languages selected (valid state)
- **Single Language:** No dialect reward shown
- **Multiple Languages:** Shows dialect reward inputs
- **Dialect Present:** Triggers accent support

### Region Management
- **Auto vs Manual:** Auto-populated but editable
- **Format:** Newline-separated in textarea, array in state
- **Validation:** No format validation (free text)

---

## Testing Considerations

### Test Scenarios

1. **Country Selection:**
   - Select country → verify regions auto-populate
   - Change country → verify regions update
   - Clear country → verify regions clear

2. **Age Bracket:**
   - Set min=0, max=65 → verify age inputs hidden
   - Set min=18, max=65 → verify age inputs shown
   - Clear both → verify "all ages" message

3. **Language Profiles:**
   - Add single language → verify no dialect reward
   - Add second language → verify dialect reward appears
   - Add dialect → verify accent support enabled

4. **Branching Logic:**
   - Audio goal + dialect → verify accent support
   - Multiple languages → verify dialect reward
   - All ages → verify age details hidden

5. **Auto-Save:**
   - Change field → verify 900ms debounce
   - Multiple rapid changes → verify single save
   - Network error → verify error state

---

## Future Enhancements (Potential)

Based on codebase structure, potential improvements:

1. **More Countries:**
   - Expand beyond 5 countries
   - Dynamic country list from database

2. **Region Validation:**
   - Validate sub-regions against country
   - Auto-complete for regions

3. **Language Autocomplete:**
   - Pre-populated language list
   - Dialect suggestions based on language

4. **Advanced Demographics:**
   - Gender selection
   - Occupation filters
   - Education level

5. **Geographic Visualization:**
   - Map interface for region selection
   - Visual representation of target areas

---

## Code Dependencies

### Direct Dependencies
- `@/components/ui/button` - Button component
- `@/components/ui/input` - Input component
- `@/components/ui/label` - Label component
- `@/store/useCampaignBuilderStore` - State management
- `@/lib/campaign/branching` - Branching logic
- `@/lib/utils` - Utility functions (cn)
- `@/types/campaign-journey` - TypeScript types

### Indirect Dependencies
- React hooks (useState, useEffect)
- Zustand for state management
- Next.js for routing and API

---

## Summary

Step 3 (Target Audience) is a comprehensive form that captures:
- **Geographic targeting:** Country, region, sub-regions, locale type
- **Demographics:** Age bracket, group size expectations
- **Linguistic requirements:** Languages, dialects, reward recommendations

The step features:
- ✅ Smart branching logic that shows/hides fields conditionally
- ✅ Auto-population of regions based on country
- ✅ Dynamic language profile management
- ✅ Real-time auto-save with debouncing
- ✅ Integration with pricing, rewards, and question building
- ✅ Responsive, accessible UI design

The implementation is production-ready and handles edge cases gracefully while providing a smooth user experience.



