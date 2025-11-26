import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: languages, error } = await supabase
        .from('language_configurations')
        .select('*')
        .order('language_name')

      if (error) throw error

      return NextResponse.json({
        success: true,
        languages: languages || [],
      })
    } catch (error: any) {
      console.error('Error fetching language configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch language configurations', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await request.json()
      const supabase = await createClient()

      if (body.id) {
        const { data: language, error } = await supabase
          .from('language_configurations')
          .update({
            is_supported: body.is_supported,
            default_currency: body.default_currency,
            cost_multiplier: body.cost_multiplier,
            reward_multiplier: body.reward_multiplier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          language,
        })
      }

      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    } catch (error: any) {
      console.error('Error updating language config:', error)
      return NextResponse.json(
        { error: 'Failed to update language configuration', details: error.message },
        { status: 500 }
      )
    }
  })
}



