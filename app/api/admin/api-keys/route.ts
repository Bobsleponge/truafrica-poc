import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/api-keys
 * Get all API keys (admin only)
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const supabase = await createClient()
      
      // Get all API keys with user info
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select(`
          *,
          users!api_keys_client_id_fkey (
            id,
            email,
            name,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        success: true,
        apiKeys: apiKeys || [],
      })
    } catch (error: any) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error.message },
        { status: 500 }
      )
    }
  })
}


