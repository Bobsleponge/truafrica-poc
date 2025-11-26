import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVersionHistory, createVersion, restoreVersion } from '@/lib/services/versionControlService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const versions = await getVersionHistory(params.id)

    return NextResponse.json({
      success: true,
      versions,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get versions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, notes, restoreFromVersionId } = body

    let version
    if (restoreFromVersionId) {
      version = await restoreVersion(params.id, restoreFromVersionId, user.id, notes)
    } else {
      if (!data) {
        return NextResponse.json(
          { error: 'data is required' },
          { status: 400 }
        )
      }
      version = await createVersion(params.id, data, user.id, notes)
    }

    return NextResponse.json({
      success: true,
      version,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create version' },
      { status: 500 }
    )
  }
}



