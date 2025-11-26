import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/config/pricing
 * Get all pricing rules
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: rules, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('question_type')

      if (error) throw error

      return NextResponse.json({
        success: true,
        rules: rules || [],
      })
    } catch (error: any) {
      console.error('Error fetching pricing rules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pricing rules', details: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/admin/config/pricing
 * Create a new pricing rule
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await request.json()
      const supabase = await createClient()

      const { data: rule, error } = await supabase
        .from('pricing_rules')
        .insert({
          question_type: body.question_type,
          base_price_per_answer: body.base_price_per_answer,
          base_cost_per_answer: body.base_cost_per_answer,
          multiplier_factors: body.multiplier_factors || {},
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
      console.error('Error creating pricing rule:', error)
      return NextResponse.json(
        { error: 'Failed to create pricing rule', details: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PUT /api/admin/config/pricing
 * Update pricing rules (bulk or single)
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await request.json()
      const supabase = await createClient()

      // If updating a single rule
      if (body.id) {
        const { data: rule, error } = await supabase
          .from('pricing_rules')
          .update({
            base_price_per_answer: body.base_price_per_answer,
            base_cost_per_answer: body.base_cost_per_answer,
            multiplier_factors: body.multiplier_factors,
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

      // Bulk update
      if (Array.isArray(body.rules)) {
        const updates = body.rules.map((rule: any) =>
          supabase
            .from('pricing_rules')
            .update({
              base_price_per_answer: rule.base_price_per_answer,
              base_cost_per_answer: rule.base_cost_per_answer,
              multiplier_factors: rule.multiplier_factors,
              is_active: rule.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rule.id)
        )

        const results = await Promise.all(updates)
        const errors = results.filter(r => r.error)

        if (errors.length > 0) {
          throw new Error(`Failed to update ${errors.length} rules`)
        }

        return NextResponse.json({
          success: true,
          updated: body.rules.length,
        })
      }

      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    } catch (error: any) {
      console.error('Error updating pricing rules:', error)
      return NextResponse.json(
        { error: 'Failed to update pricing rules', details: error.message },
        { status: 500 }
      )
    }
  })
}



