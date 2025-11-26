import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportToMarkdown, exportToJSON, generateShareableLink } from '@/lib/services/exportService'

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

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Get campaign data
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    const campaignData = campaign.wizard_data || {}

    if (format === 'shareable') {
      const link = await generateShareableLink(params.id)
      return NextResponse.json({
        success: true,
        link,
      })
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'markdown') {
      content = exportToMarkdown(campaignData)
      contentType = 'text/markdown'
      filename = `campaign-${params.id}.md`
    } else if (format === 'json') {
      content = exportToJSON(campaignData)
      contentType = 'application/json'
      filename = `campaign-${params.id}.json`
    } else if (format === 'pdf') {
      // PDF export is handled client-side with react-pdf
      // Return the data for client-side processing
      return NextResponse.json({
        success: true,
        data: campaignData,
        filename: `campaign-${params.id}.pdf`,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use: markdown, json, pdf, or shareable' },
        { status: 400 }
      )
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export campaign' },
      { status: 500 }
    )
  }
}
