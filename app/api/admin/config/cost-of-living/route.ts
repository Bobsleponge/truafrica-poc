import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: multipliers, error } = await supabase
        .from('cost_of_living_multipliers')
        .select('*')
        .order('country_name')

      if (error) throw error

      return NextResponse.json({
        success: true,
        multipliers: multipliers || [],
      })
    } catch (error: any) {
      console.error('Error fetching cost of living multipliers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cost of living multipliers', details: error.message },
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

      const { data: multiplier, error } = await supabase
        .from('cost_of_living_multipliers')
        .insert({
          country_code: body.country_code,
          country_name: body.country_name,
          currency: body.currency,
          multiplier: body.multiplier,
          notes: body.notes,
          updated_by: body.updated_by,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        multiplier,
      })
    } catch (error: any) {
      console.error('Error creating cost of living multiplier:', error)
      return NextResponse.json(
        { error: 'Failed to create cost of living multiplier', details: error.message },
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
        const { data: multiplier, error } = await supabase
          .from('cost_of_living_multipliers')
          .update({
            multiplier: body.multiplier,
            notes: body.notes,
            last_updated: new Date().toISOString(),
            updated_by: body.updated_by,
          })
          .eq('id', body.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          multiplier,
        })
      }

      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    } catch (error: any) {
      console.error('Error updating cost of living multiplier:', error)
      return NextResponse.json(
        { error: 'Failed to update cost of living multiplier', details: error.message },
        { status: 500 }
      )
    }
  })
}



