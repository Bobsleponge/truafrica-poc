import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'
import type { AdminUser } from '@/types/admin'

/**
 * GET /api/admin/users
 * Get all users with optional filtering
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const role = searchParams.get('role')
      const country = searchParams.get('country')
      const search = searchParams.get('search')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = (page - 1) * limit

      const supabase = await createClient()
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (role) {
        query = query.eq('role', role)
      }
      if (country) {
        query = query.eq('country', country)
      }
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const users: AdminUser[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        trust_score: user.trust_score,
        onboarding_completed: user.onboarding_completed,
        created_at: user.created_at,
        updated_at: user.updated_at,
        languages: user.languages || [],
        expertise_fields: user.expertise_fields || [],
      }))

      return NextResponse.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json()
      const { email, password, role, name, country } = body

      if (!email || !password || !role) {
        return NextResponse.json(
          { error: 'Email, password, and role are required' },
          { status: 400 }
        )
      }

      const supabase = await createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) throw authError
      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          role,
          name: name || null,
          country: country || null,
          languages: role === 'contributor' ? [] : null,
          expertise_fields: role === 'contributor' ? [] : null,
          trust_score: role === 'contributor' ? 50 : null,
          onboarding_completed: role !== 'contributor',
        })

      if (profileError) throw profileError

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email,
          role,
          name: name || null,
        },
      })
    } catch (error: any) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      )
    }
  })
}



