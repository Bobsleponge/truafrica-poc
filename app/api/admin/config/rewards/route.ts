import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: rules, error } = await supabase
        .from('global_reward_rules')
        .select('*')
        .order('question_type')

      if (error) throw error

      return NextResponse.json({
        success: true,
        rules: rules || [],
      })
    } catch (error: any) {
      console.error('Error fetching reward rules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reward rules', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await request.json()
      const supabase = await createClient()

      const { data: rule, error } = await supabase
        .from('global_reward_rules')
        .insert({
          question_type: body.question_type,
          base_reward_per_question: body.base_reward_per_question,
          task_type_multipliers: body.task_type_multipliers || {},
          country_multipliers: body.country_multipliers || {},
          min_reward: body.min_reward,
          max_reward: body.max_reward,
          currency: body.currency || 'USD',
          is_active: body.is_active !== undefined ? body.is_active : true,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        rule,
      })
    } catch (error: any) {
      console.error('Error creating reward rule:', error)
      return NextResponse.json(
        { error: 'Failed to create reward rule', details: error.message },
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
        const { data: rule, error } = await supabase
          .from('global_reward_rules')
          .update({
            base_reward_per_question: body.base_reward_per_question,
            task_type_multipliers: body.task_type_multipliers,
            country_multipliers: body.country_multipliers,
            min_reward: body.min_reward,
            max_reward: body.max_reward,
            is_active: body.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          rule,
        })
      }

      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    } catch (error: any) {
      console.error('Error updating reward rule:', error)
      return NextResponse.json(
        { error: 'Failed to update reward rule', details: error.message },
        { status: 500 }
      )
    }
  })
}



