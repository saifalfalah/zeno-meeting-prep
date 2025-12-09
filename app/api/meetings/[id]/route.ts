import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMeetingById } from "@/lib/db/queries/meetings";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch meeting
    const meeting = await getMeetingById(id);

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Return meeting data
    return NextResponse.json({
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
      campaignId: meeting.campaignId,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
