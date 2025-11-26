import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: template, error } = await supabase
        .from('question_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        template,
      })
    } catch (error: any) {
      console.error('Error fetching template:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const body = await request.json()
      const supabase = await createClient()

      const { data: template, error } = await supabase
        .from('question_templates')
        .update({
          sector: body.sector,
          question_type: body.question_type,
          content: body.content,
          options: body.options,
          metadata: body.metadata,
          is_internal: body.is_internal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        template,
      })
    } catch (error: any) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template', details: error.message },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { error } = await supabase
        .from('question_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Template deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template', details: error.message },
        { status: 500 }
      )
    }
  })
}



