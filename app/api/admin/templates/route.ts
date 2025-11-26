import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const sector = searchParams.get('sector')
      const isInternal = searchParams.get('is_internal')
      const search = searchParams.get('search')

      const supabase = await createClient()
      let query = supabase
        .from('question_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (sector) {
        query = query.eq('sector', sector)
      }
      if (isInternal !== null) {
        query = query.eq('is_internal', isInternal === 'true')
      }
      if (search) {
        query = query.ilike('content', `%${search}%`)
      }

      const { data: templates, error } = await query

      if (error) throw error

      return NextResponse.json({
        success: true,
        templates: templates || [],
      })
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
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

      const { data: template, error } = await supabase
        .from('question_templates')
        .insert({
          sector: body.sector,
          question_type: body.question_type,
          content: body.content,
          options: body.options || [],
          metadata: body.metadata || {},
          is_internal: body.is_internal || false,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        template,
      })
    } catch (error: any) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      )
    }
  })
}



