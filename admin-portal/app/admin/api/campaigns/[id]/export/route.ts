import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdmin()
    
    const supabase = createServerClient()
    const { id: campaignId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'campaign' // campaign, answers, analytics

    if (type === 'campaign') {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (format === 'csv') {
        const csv = Papa.unparse([campaign || {}], { header: true })
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="campaign-${campaignId}.csv"`,
          },
        })
      }
    } else if (type === 'answers') {
      // Get answers for export
      const { data: campaignQuestions } = await supabase
        .from('campaign_questions')
        .select('question_id')
        .eq('campaign_id', campaignId)

      const questionIds = campaignQuestions?.map((cq) => cq.question_id) || []

      if (questionIds.length > 0) {
        const { data: answers } = await supabase
          .from('answers')
          .select(`
            *,
            question:questions(id, content),
            contributor:users!answers_contributor_id_fkey(id, email)
          `)
          .in('question_id', questionIds)

        if (format === 'csv') {
          const exportData = (answers || []).map((answer) => ({
            'Question ID': answer.question_id,
            'Question': (answer.question as any)?.content || '',
            'Contributor': (answer.contributor as any)?.email || '',
            'Answer': answer.answer_text,
            'Consensus Score': answer.consensus_score || '',
            'Correct': answer.correct ? 'Yes' : 'No',
            'Created At': new Date(answer.created_at).toLocaleString(),
          }))

          const csv = Papa.unparse(exportData, { header: true })
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="campaign-${campaignId}-answers.csv"`,
            },
          })
        }
      }
    }

    return NextResponse.json({ error: 'Invalid type or format' }, { status: 400 })
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



