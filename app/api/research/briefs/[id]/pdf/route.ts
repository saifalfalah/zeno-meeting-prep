import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getResearchBriefById } from '@/lib/db/queries/briefs';
import { generateBriefPDF, type BriefPDFData } from '@/lib/services/pdf';

/**
 * Sanitize filename to remove special characters that may cause issues
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length
}

/**
 * Generate PDF export of research brief
 * GET /api/research/briefs/[id]/pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch research brief with all related data
    const brief = await getResearchBriefById(id);

    if (!brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }

    // Transform database data to PDF format
    const pdfData: BriefPDFData = {
      meeting: {
        title:
          brief.meeting?.title ||
          brief.adHocRequest?.prospectName ||
          'Research Brief',
        startTime: brief.meeting?.startTime || brief.generatedAt,
        timezone: brief.meeting?.timezone || 'UTC',
      },
      campaign: {
        companyName: brief.campaign?.companyName || 'Unknown Company',
        offeringTitle: brief.campaign?.offeringTitle || 'Unknown Offering',
      },
      brief: {
        confidenceRating: brief.confidenceRating,
        confidenceExplanation: brief.confidenceExplanation,
        companyOverview: brief.companyOverview,
        painPoints: brief.painPoints,
        howWeFit: brief.howWeFit,
        openingLine: brief.openingLine,
        discoveryQuestions: brief.discoveryQuestions
          ? JSON.parse(brief.discoveryQuestions)
          : null,
        successOutcome: brief.successOutcome,
        watchOuts: brief.watchOuts,
        recentSignals: brief.recentSignals ? JSON.parse(brief.recentSignals) : null,
      },
      prospects:
        brief.prospectInfo?.map((info) => ({
          name: info.prospect?.name,
          title: info.title,
          companyName: info.prospect?.company?.name,
          email: info.prospect?.email,
        })) || [],
      company:
        brief.prospectInfo?.[0]?.prospect?.company
          ? {
              name: brief.prospectInfo[0].prospect.company.name,
              industry: brief.prospectInfo[0].prospect.company.industry,
              employeeCount: brief.prospectInfo[0].prospect.company.employeeCount,
              fundingStage: brief.prospectInfo[0].prospect.company.fundingStage,
            }
          : {},
      sources:
        brief.researchSources?.map((source) => ({
          sourceType: source.sourceType,
          url: source.url,
          title: source.title,
        })) || [],
    };

    // Generate PDF buffer
    const pdfBuffer = await generateBriefPDF(pdfData);

    // Create sanitized filename
    const baseFilename = sanitizeFilename(pdfData.meeting.title);
    const filename = `${baseFilename || 'research-brief'}.pdf`;

    // Return PDF with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
