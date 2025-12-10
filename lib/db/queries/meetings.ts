import { eq, and, gte, lte, asc } from "drizzle-orm";
import { db } from "../client";
import { meetings, type researchStatusEnum } from "../schema";

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

/**
 * Get meetings by campaign ID
 */
export async function getMeetingsByCampaignId(campaignId: string) {
  return db.query.meetings.findMany({
    where: eq(meetings.campaignId, campaignId),
    orderBy: [asc(meetings.startTime)],
    with: {
      campaign: true,
      meetingProspects: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchBrief: true,
    },
  });
}

/**
 * Get meetings by date range
 */
export async function getMeetingsByDateRange(
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return db.query.meetings.findMany({
    where: and(
      eq(meetings.campaignId, campaignId),
      gte(meetings.startTime, startDate),
      lte(meetings.startTime, endDate)
    ),
    orderBy: [asc(meetings.startTime)],
    with: {
      campaign: true,
      meetingProspects: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchBrief: true,
    },
  });
}

/**
 * Get a meeting by ID
 */
export async function getMeetingById(id: string) {
  return db.query.meetings.findFirst({
    where: eq(meetings.id, id),
    with: {
      campaign: true,
      meetingProspects: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchBrief: {
        with: {
          prospectInfo: {
            with: {
              prospect: true,
            },
          },
          researchSources: true,
        },
      },
    },
  });
}

/**
 * Get meeting by Google Event ID
 */
export async function getMeetingByGoogleEventId(campaignId: string, googleEventId: string) {
  return db.query.meetings.findFirst({
    where: and(
      eq(meetings.campaignId, campaignId),
      eq(meetings.googleEventId, googleEventId)
    ),
  });
}

/**
 * Create a new meeting
 */
export async function createMeeting(data: NewMeeting) {
  const [meeting] = await db.insert(meetings).values(data).returning();
  return meeting;
}

/**
 * Update a meeting
 */
export async function updateMeeting(id: string, data: Partial<NewMeeting>) {
  const [meeting] = await db
    .update(meetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(meetings.id, id))
    .returning();
  return meeting;
}

/**
 * Update meeting research status
 */
export async function updateMeetingResearchStatus(
  id: string,
  researchStatus: (typeof researchStatusEnum.enumValues)[number],
  researchBriefId?: string,
  researchFailureReason?: string
) {
  const [meeting] = await db
    .update(meetings)
    .set({
      researchStatus,
      researchBriefId: researchBriefId || null,
      researchFailureReason: researchFailureReason || null,
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, id))
    .returning();
  return meeting;
}

/**
 * Get meetings needing research
 */
export async function getMeetingsNeedingResearch(campaignId: string) {
  return db.query.meetings.findMany({
    where: and(
      eq(meetings.campaignId, campaignId),
      eq(meetings.hasExternalAttendees, true),
      eq(meetings.researchStatus, "none")
    ),
    orderBy: [asc(meetings.startTime)],
  });
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(id: string) {
  await db.delete(meetings).where(eq(meetings.id, id));
}
