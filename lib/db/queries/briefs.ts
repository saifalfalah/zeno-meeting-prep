import { eq, desc } from "drizzle-orm";
import { db } from "../client";
import { researchBriefs } from "../schema";

export type ResearchBrief = typeof researchBriefs.$inferSelect;
export type NewResearchBrief = typeof researchBriefs.$inferInsert;

/**
 * Get a research brief by ID
 */
export async function getResearchBriefById(id: string) {
  return db.query.researchBriefs.findFirst({
    where: eq(researchBriefs.id, id),
    with: {
      campaign: true,
      meeting: {
        with: {
          meetingProspects: {
            with: {
              prospect: {
                with: {
                  company: true,
                },
              },
            },
          },
        },
      },
      adHocRequest: true,
      prospectInfo: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchSources: true,
    },
  });
}

/**
 * Get research brief by meeting ID
 */
export async function getResearchBriefByMeetingId(meetingId: string) {
  return db.query.researchBriefs.findFirst({
    where: eq(researchBriefs.meetingId, meetingId),
    with: {
      prospectInfo: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchSources: true,
    },
  });
}

/**
 * Get research brief by ad-hoc request ID
 */
export async function getResearchBriefByAdHocRequestId(adHocRequestId: string) {
  return db.query.researchBriefs.findFirst({
    where: eq(researchBriefs.adHocRequestId, adHocRequestId),
    with: {
      prospectInfo: {
        with: {
          prospect: {
            with: {
              company: true,
            },
          },
        },
      },
      researchSources: true,
    },
  });
}

/**
 * Get research briefs by campaign ID
 */
export async function getResearchBriefsByCampaignId(campaignId: string) {
  return db.query.researchBriefs.findMany({
    where: eq(researchBriefs.campaignId, campaignId),
    orderBy: [desc(researchBriefs.generatedAt)],
    with: {
      meeting: true,
      adHocRequest: true,
    },
  });
}

/**
 * Create a new research brief
 */
export async function createResearchBrief(data: NewResearchBrief) {
  const [brief] = await db.insert(researchBriefs).values(data).returning();
  return brief;
}

/**
 * Update a research brief
 */
export async function updateResearchBrief(id: string, data: Partial<NewResearchBrief>) {
  const [brief] = await db
    .update(researchBriefs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(researchBriefs.id, id))
    .returning();
  return brief;
}

/**
 * Delete a research brief (only for ad-hoc requests)
 */
export async function deleteResearchBrief(id: string) {
  await db.delete(researchBriefs).where(eq(researchBriefs.id, id));
}
