import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()

    // Check database connection
    const { error: dbError } = await supabase.from('users').select('id').limit(1)

    // Get settings for maintenance mode
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('system_toggles')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const maintenanceMode = settings?.system_toggles?.maintenance_mode || false

    // Get recent errors (if error_logs table exists)
    const recentErrors: any[] = []

    return NextResponse.json({
      status: dbError ? 'degraded' : 'healthy',
      maintenanceMode,
      database: dbError ? 'error' : 'connected',
      recentErrors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    if (error.message === 'redirect') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



