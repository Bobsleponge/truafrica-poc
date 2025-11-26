import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Get settings from platform_settings table if it exists, otherwise return defaults
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Return settings or defaults
    return NextResponse.json({
      settings: data || {
        reward_settings: {
          default_reward_amount: 0,
          reward_currency: 'USD',
          min_reward: 0,
          max_reward: 1000,
        },
        system_toggles: {
          allow_new_registrations: true,
          maintenance_mode: false,
          enable_rewards: true,
        },
        internal_notes: '',
      },
    })
  } catch (error: any) {
    if (error.message === 'redirect') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



