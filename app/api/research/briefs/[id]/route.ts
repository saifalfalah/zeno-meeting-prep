import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getResearchBriefById } from "@/lib/db/queries/briefs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Fetch research brief with related data
    const brief = await getResearchBriefById(id);

    if (!brief) {
      return NextResponse.json(
        { error: "Research brief not found" },
        { status: 404 }
      );
    }

    // Transform database data to match component props structure
    const transformedBrief = {
      header: {
        prospect: {
          name: brief.prospectInfo?.[0]?.prospect?.name || null,
          title: brief.prospectInfo?.[0]?.title || null,
          location: brief.prospectInfo?.[0]?.location || null,
        },
        company: {
          name: brief.prospectInfo?.[0]?.prospect?.company?.name || null,
          industry: brief.prospectInfo?.[0]?.prospect?.company?.industry || null,
          size: brief.prospectInfo?.[0]?.prospect?.company?.employeeCount || null,
        },
        meeting: {
          title: brief.meeting?.title || brief.adHocRequest?.prospectName || "Ad-Hoc Research",
          startTime: brief.meeting?.startTime?.toISOString() || brief.generatedAt.toISOString(),
          campaign: brief.campaign?.name || "Unknown Campaign",
          duration: brief.meeting
            ? `${Math.round((brief.meeting.endTime.getTime() - brief.meeting.startTime.getTime()) / 60000)} min`
            : "N/A",
        },
      },
      quickFacts: {
        companyAtAGlance: {
          name: brief.prospectInfo?.[0]?.prospect?.company?.name || null,
          industry: brief.prospectInfo?.[0]?.prospect?.company?.industry || null,
          employeeCount: brief.prospectInfo?.[0]?.prospect?.company?.employeeCount || null,
          fundingStage: brief.prospectInfo?.[0]?.prospect?.company?.fundingStage || null,
          headquarters: brief.prospectInfo?.[0]?.prospect?.company?.headquarters || null,
        },
        prospectAtAGlance: {
          name: brief.prospectInfo?.[0]?.prospect?.name || null,
          title: brief.prospectInfo?.[0]?.title || null,
          reportsTo: brief.prospectInfo?.[0]?.reportsTo || null,
          teamSize: brief.prospectInfo?.[0]?.teamSize || null,
          background: brief.prospectInfo?.[0]?.background || null,
        },
        recentSignals: brief.recentSignals
          ? JSON.parse(brief.recentSignals)
          : [],
      },
      deepDive: {
        whatTheyDo: brief.companyOverview,
        painPoints: brief.painPoints,
        howWeFit: brief.howWeFit,
      },
      callStrategy: {
        openingLine: brief.openingLine,
        discoveryQuestions: brief.discoveryQuestions
          ? JSON.parse(brief.discoveryQuestions)
          : [],
        successOutcome: brief.successOutcome,
        watchOuts: brief.watchOuts,
      },
      footer: {
        confidenceRating: brief.confidenceRating,
        confidenceExplanation: brief.confidenceExplanation,
        sources: (brief.researchSources || []).map((source) => ({
          type: source.sourceType,
          url: source.url,
          title: source.title || source.url,
        })),
      },
    };

    return NextResponse.json(transformedBrief);
  } catch (error) {
    console.error("Error fetching research brief:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
