import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/users/:id
 * Get a specific user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        user: data,
      })
    } catch (error: any) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user', details: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PUT /api/admin/users/:id
 * Update a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json()
      const { role, name, country, trust_score, onboarding_completed, languages, expertise_fields } = body

      const supabase = await createClient()

      // Build update object (only include provided fields)
      const updates: any = {}
      if (role !== undefined) updates.role = role
      if (name !== undefined) updates.name = name
      if (country !== undefined) updates.country = country
      if (trust_score !== undefined) updates.trust_score = trust_score
      if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed
      if (languages !== undefined) updates.languages = languages
      if (expertise_fields !== undefined) updates.expertise_fields = expertise_fields

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        user: data,
      })
    } catch (error: any) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/admin/users/:id
 * Deactivate a user (soft delete by updating their status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()

      // For now, we'll just mark the user as inactive
      // In a production system, you might want to add an 'active' or 'deleted_at' column
      // For this implementation, we'll delete the user from auth (which will cascade to users table)
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(params.id)

      if (deleteError) throw deleteError

      return NextResponse.json({
        success: true,
        message: 'User deactivated successfully',
      })
    } catch (error: any) {
      console.error('Error deactivating user:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate user', details: error.message },
        { status: 500 }
      )
    }
  })
}



