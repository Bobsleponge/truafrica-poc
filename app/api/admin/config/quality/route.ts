import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data: config, error } = await supabase
        .from('global_quality_config')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned

      return NextResponse.json({
        success: true,
        config: config || null,
      })
    } catch (error: any) {
      console.error('Error fetching quality config:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quality configuration', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, userId) => {
    try {
      const body = await request.json()
      const supabase = await createClient()

      // Check if config exists
      const { data: existing } = await supabase
        .from('global_quality_config')
        .select('id')
        .single()

      let result
      if (existing) {
        // Update existing
        const { data: config, error } = await supabase
          .from('global_quality_config')
          .update({
            minimum_quality_score: body.minimum_quality_score,
            duplicate_detection_level: body.duplicate_detection_level,
            geo_verification_enabled: body.geo_verification_enabled,
            geo_verification_strictness: body.geo_verification_strictness,
            ai_validation_strictness: body.ai_validation_strictness,
            ai_confidence_threshold: body.ai_confidence_threshold,
            human_review_threshold: body.human_review_threshold,
            updated_at: new Date().toISOString(),
            updated_by: userId,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = config
      } else {
        // Create new
        const { data: config, error } = await supabase
          .from('global_quality_config')
          .insert({
            minimum_quality_score: body.minimum_quality_score,
            duplicate_detection_level: body.duplicate_detection_level,
            geo_verification_enabled: body.geo_verification_enabled,
            geo_verification_strictness: body.geo_verification_strictness,
            ai_validation_strictness: body.ai_validation_strictness,
            ai_confidence_threshold: body.ai_confidence_threshold,
            human_review_threshold: body.human_review_threshold,
            updated_by: userId,
          })
          .select()
          .single()

        if (error) throw error
        result = config
      }

      return NextResponse.json({
        success: true,
        config: result,
      })
    } catch (error: any) {
      console.error('Error updating quality config:', error)
      return NextResponse.json(
        { error: 'Failed to update quality configuration', details: error.message },
        { status: 500 }
      )
    }
  })
}



