import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { researchBriefs, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateResearchBriefPDF, type ResearchBriefPDFData } from '@/lib/services/pdf'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/research/briefs/[id]/pdf
 * Generates and downloads a PDF version of the research brief
 */
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get research brief with related data
    const brief = await db.query.researchBriefs.findFirst({
      where: eq(researchBriefs.id, params.id),
      with: {
        campaign: true,
        meeting: true,
        prospectInfo: {
          with: {
            prospect: true,
          },
        },
        researchSources: true,
      },
    })

    if (!brief) {
      return NextResponse.json(
        { error: 'Research brief not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (brief.campaign.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Brief belongs to different user' },
        { status: 403 }
      )
    }

    // Prepare PDF data
    const pdfData: ResearchBriefPDFData = {
      meetingTitle: brief.meeting?.title,
      companyName: brief.campaign.companyName,
      prospectNames: brief.prospectInfo.map((p) => p.prospect.name || p.prospect.email),
      generatedAt: brief.generatedAt,
      confidenceRating: brief.confidenceRating,
      confidenceExplanation: brief.confidenceExplanation || undefined,
      companyOverview: brief.companyOverview || undefined,
      painPoints: brief.painPoints || undefined,
      howWeFit: brief.howWeFit || undefined,
      openingLine: brief.openingLine || undefined,
      discoveryQuestions: brief.discoveryQuestions
        ? JSON.parse(brief.discoveryQuestions)
        : undefined,
      successOutcome: brief.successOutcome || undefined,
      watchOuts: brief.watchOuts || undefined,
      recentSignals: brief.recentSignals ? JSON.parse(brief.recentSignals) : undefined,
      sources: brief.researchSources.map((s) => ({
        url: s.url,
        title: s.title || undefined,
      })),
    }

    // Generate PDF
    const pdfBuffer = await generateResearchBriefPDF(pdfData)

    // Create filename
    const filename = `research-brief-${brief.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
