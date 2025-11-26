import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const { id: userId } = await params

    // Get user's answers (activity)
    const { data: answers } = await supabase
      .from('answers')
      .select('id, question_id, created_at, consensus_score, correct')
      .eq('contributor_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    // Get user's campaigns if they're a client
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, created_at, status')
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      activity: {
        answers: answers || [],
        campaigns: campaigns || [],
      },
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



