import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/admin/api-keys/:id
 * Revoke an API key (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Revoke the key
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully',
      })
    } catch (error: any) {
      console.error('Error revoking API key:', error)
      return NextResponse.json(
        { error: 'Failed to revoke API key', details: error.message },
        { status: 500 }
      )
    }
  })
}



