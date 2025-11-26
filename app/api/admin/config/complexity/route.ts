import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: configs, error } = await supabase
        .from('complexity_configurations')
        .select('*')
        .order('difficulty_level')

      if (error) throw error

      return NextResponse.json({
        success: true,
        configs: configs || [],
      })
    } catch (error: any) {
      console.error('Error fetching complexity configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch complexity configurations', details: error.message },
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
        const { data: config, error } = await supabase
          .from('complexity_configurations')
          .update({
            multiplier_value: body.multiplier_value,
            default_assignment_rules: body.default_assignment_rules || {},
            ai_assistance_threshold: body.ai_assistance_threshold,
            description: body.description,
            is_active: body.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          config,
        })
      }

      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    } catch (error: any) {
      console.error('Error updating complexity config:', error)
      return NextResponse.json(
        { error: 'Failed to update complexity configuration', details: error.message },
        { status: 500 }
      )
    }
  })
}



