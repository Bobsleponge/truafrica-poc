import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: configs, error } = await supabase
        .from('task_type_configurations')
        .select('*')
        .order('task_type')

      if (error) throw error

      return NextResponse.json({
        success: true,
        configs: configs || [],
      })
    } catch (error: any) {
      console.error('Error fetching task type configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch task type configurations', details: error.message },
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
          .from('task_type_configurations')
          .update({
            base_reward_multiplier: body.base_reward_multiplier,
            base_cost_multiplier: body.base_cost_multiplier,
            estimated_time_seconds: body.estimated_time_seconds,
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
      console.error('Error updating task type config:', error)
      return NextResponse.json(
        { error: 'Failed to update task type configuration', details: error.message },
        { status: 500 }
      )
    }
  })
}



