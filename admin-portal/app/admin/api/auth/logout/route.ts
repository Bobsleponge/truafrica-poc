import { NextRequest, NextResponse } from 'next/server'
import { destroyAdminSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    await destroyAdminSession()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



