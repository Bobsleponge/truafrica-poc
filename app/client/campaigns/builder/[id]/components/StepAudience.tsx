'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCampaignBuilderStore } from '@/store/useCampaignBuilderStore'
import { getRegionsForCountry } from '@/lib/campaign/branching'
import { cn } from '@/lib/utils'

const COUNTRIES = ['Kenya', 'South Africa', 'Nigeria', 'Ghana', 'Uganda']

const COUNTRY_REGIONS: Record<string, string[]> = {
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

const COUNTRY_LANGUAGES: Record<string, string[]> = {
  Kenya: ['Swahili', 'English', 'Kikuyu', 'Luhya', 'Luo', 'Kalenjin', 'Kamba', 'Kisii'],
  'South Africa': ['English', 'Zulu', 'Xhosa', 'Afrikaans', 'Sotho', 'Tswana', 'Venda', 'Tsonga'],
  Nigeria: ['English', 'Yoruba', 'Igbo', 'Hausa', 'Fulfulde', 'Kanuri', 'Ibibio', 'Tiv'],
  Ghana: ['English', 'Akan', 'Ewe', 'Ga', 'Dagbani', 'Dagaare', 'Nzema', 'Kasem'],
  Uganda: ['English', 'Swahili', 'Luganda', 'Runyoro', 'Runyankole', 'Lusoga', 'Acholi', 'Lango'],
}

const AGE_PRESETS = [
  { value: 'all_adults', label: 'All adults' },
  { value: '18_24', label: '18-24' },
  { value: '25_34', label: '25-34' },
  { value: '35_44', label: '35-44' },
  { value: '45_plus', label: '45+' },
  { value: 'custom', label: 'Custom' },
] as const

export function StepAudience() {
  const campaign = useCampaignBuilderStore((state) => state.campaign)
  const setField = useCampaignBuilderStore((state) => state.setField)
  const branching = useCampaignBuilderStore((state) => state.branching)

  const country = campaign.audience.country
  const regions = country ? COUNTRY_REGIONS[country] || [] : []
  const languages = country ? COUNTRY_LANGUAGES[country] || [] : []
  const selectedLanguages = campaign.audience.languages || []
  const ageRange = campaign.audience.ageRange || { preset: undefined }

  // Reset region when country changes and region is not in new list
  useEffect(() => {
    if (country && campaign.audience.region) {
      const availableRegions = COUNTRY_REGIONS[country] || []
      if (!availableRegions.includes(campaign.audience.region)) {
        setField('audience', 'region', '')
      }
    } else if (!country) {
      setField('audience', 'region', '')
    }
  }, [country, campaign.audience.region, setField])

  const handleLanguageToggle = (language: string) => {
    const current = selectedLanguages
    const updated = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language]
    setField('audience', 'languages', updated)
  }

  const handleAgePresetChange = (preset: typeof AGE_PRESETS[number]['value']) => {
    if (preset === 'custom') {
      setField('audience', 'ageRange', { preset: 'custom', min: undefined, max: undefined })
    } else if (preset === 'all_adults') {
      setField('audience', 'ageRange', { preset: 'all_adults' })
    } else {
      // Set predefined ranges
      const ranges: Record<string, { min: number; max: number }> = {
        '18_24': { min: 18, max: 24 },
        '25_34': { min: 25, max: 34 },
        '35_44': { min: 35, max: 44 },
        '45_plus': { min: 45, max: 100 },
      }
      setField('audience', 'ageRange', { preset, ...ranges[preset] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">
          Country <span className="text-red-400">*</span>
        </Label>
        <select
          value={country || ''}
          onChange={(event) => {
            setField('audience', 'country', event.target.value)
          }}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
        >
          <option value="" className="bg-slate-900 text-white">
            Select market
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-slate-900 text-white">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Region/Province - Only show when showRegion is true */}
      {branching.showRegion && country && regions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">
            Region / Province
          </Label>
          <select
            value={campaign.audience.region || ''}
            onChange={(event) => setField('audience', 'region', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
          >
            <option value="" className="bg-slate-900 text-white">
              Select region (optional)
            </option>
            {regions.map((region) => (
              <option key={region} value={region} className="bg-slate-900 text-white">
                {region}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Age Range */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">Age Range</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {AGE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleAgePresetChange(preset.value)}
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm transition-all',
                ageRange.preset === preset.value
                  ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-white shadow-lg shadow-fuchsia-400/20'
                  : 'border-white/10 bg-black/30 text-slate-200 hover:border-white/20 hover:bg-black/40'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {ageRange.preset === 'custom' && (
          <div className="mt-3 flex gap-3">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-slate-400">Minimum Age</Label>
              <Input
                type="number"
                value={ageRange.min ?? ''}
                onChange={(event) =>
                  setField('audience', 'ageRange', {
                    ...ageRange,
                    min: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                placeholder="Min"
                min={0}
                max={100}
                className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-slate-400">Maximum Age</Label>
              <Input
                type="number"
                value={ageRange.max ?? ''}
                onChange={(event) =>
                  setField('audience', 'ageRange', {
                    ...ageRange,
                    max: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                placeholder="Max"
                min={0}
                max={100}
                className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Languages - Only show when showLanguages is true */}
      {branching.showLanguages && country && languages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">
            Languages (optional)
          </Label>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {languages.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${language}`}
                    checked={selectedLanguages.includes(language)}
                    onCheckedChange={() => handleLanguageToggle(language)}
                    className="border-white/30 data-[state=checked]:bg-fuchsia-500 data-[state=checked]:border-fuchsia-500"
                  />
                  <Label
                    htmlFor={`lang-${language}`}
                    className="text-sm text-slate-200 cursor-pointer"
                  >
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Urban/Rural Preference */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">
          Urban/Rural Preference (optional)
        </Label>
        <div className="flex gap-2">
          {(['none', 'urban', 'rural', 'mixed'] as const).map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => setField('audience', 'localePreference', pref)}
              className={cn(
                'flex-1 rounded-2xl border px-4 py-3 text-sm capitalize transition-all',
                campaign.audience.localePreference === pref
                  ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-white shadow-lg shadow-fuchsia-400/20'
                  : 'border-white/10 bg-black/30 text-slate-200 hover:border-white/20 hover:bg-black/40'
              )}
            >
              {pref === 'none' ? 'No preference' : pref}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Volume */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.3em] text-slate-200">
          Estimated Response Volume (optional)
        </Label>
        <select
          value={campaign.audience.estimatedVolume || ''}
          onChange={(event) =>
            setField('audience', 'estimatedVolume', event.target.value || undefined)
          }
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
        >
          <option value="" className="bg-slate-900 text-white">
            Select volume estimate
          </option>
          <option value="small" className="bg-slate-900 text-white">
            Small (&lt;500)
          </option>
          <option value="medium" className="bg-slate-900 text-white">
            Medium (500-2000)
          </option>
          <option value="large" className="bg-slate-900 text-white">
            Large (2000+)
          </option>
        </select>
      </div>
    </div>
  )
}
