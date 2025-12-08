import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMeetingsByCampaignId, getMeetingsByDateRange } from "@/lib/db/queries/meetings";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get("campaignId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    // Fetch meetings based on date range or all meetings
    let meetings;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }

      meetings = await getMeetingsByDateRange(campaignId, start, end);
    } else {
      meetings = await getMeetingsByCampaignId(campaignId);
    }

    // Transform meetings to include only necessary fields
    const transformedMeetings = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime.toISOString(),
      timezone: meeting.timezone,
      location: meeting.location,
      meetLink: meeting.meetLink,
      status: meeting.status,
      researchStatus: meeting.researchStatus,
      researchBriefId: meeting.researchBriefId,
      researchFailureReason: meeting.researchFailureReason,
      hasExternalAttendees: meeting.hasExternalAttendees,
      // Include related data if loaded
      prospects: meeting.meetingProspects?.map((mp) => ({
        id: mp.prospect.id,
        name: mp.prospect.name,
        email: mp.prospect.email,
        title: mp.prospect.title,
        isOrganizer: mp.isOrganizer,
        responseStatus: mp.responseStatus,
        company: mp.prospect.company ? {
          id: mp.prospect.company.id,
          name: mp.prospect.company.name,
          domain: mp.prospect.company.domain,
        } : null,
      })) || [],
    }));

    return NextResponse.json({
      meetings: transformedMeetings,
      count: transformedMeetings.length,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
