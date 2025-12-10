import { eq, desc } from "drizzle-orm";
import { db } from "../client";
import { adHocResearchRequests, type adHocStatusEnum } from "../schema";

export type AdHocResearchRequest = typeof adHocResearchRequests.$inferSelect;
export type NewAdHocResearchRequest = typeof adHocResearchRequests.$inferInsert;

/**
 * Get ad-hoc research requests by user ID
 */
export async function getAdHocResearchRequestsByUserId(userId: string) {
  return db.query.adHocResearchRequests.findMany({
    where: eq(adHocResearchRequests.userId, userId),
    orderBy: [desc(adHocResearchRequests.createdAt)],
    with: {
      campaign: true,
      researchBrief: true,
    },
  });
}

/**
 * Get ad-hoc research requests by campaign ID
 */
export async function getAdHocResearchRequestsByCampaignId(campaignId: string) {
  return db.query.adHocResearchRequests.findMany({
    where: eq(adHocResearchRequests.campaignId, campaignId),
    orderBy: [desc(adHocResearchRequests.createdAt)],
    with: {
      researchBrief: true,
    },
  });
}

/**
 * Get an ad-hoc research request by ID
 */
export async function getAdHocResearchRequestById(id: string) {
  return db.query.adHocResearchRequests.findFirst({
    where: eq(adHocResearchRequests.id, id),
    with: {
      campaign: true,
      researchBrief: {
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
      },
    },
  });
}

/**
 * Create a new ad-hoc research request
 */
export async function createAdHocResearchRequest(data: NewAdHocResearchRequest) {
  const [request] = await db.insert(adHocResearchRequests).values(data).returning();
  return request;
}

/**
 * Update an ad-hoc research request
 */
export async function updateAdHocResearchRequest(
  id: string,
  data: Partial<NewAdHocResearchRequest>
) {
  const [request] = await db
    .update(adHocResearchRequests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adHocResearchRequests.id, id))
    .returning();
  return request;
}

/**
 * Update ad-hoc research request status
 */
export async function updateAdHocResearchRequestStatus(
  id: string,
  status: (typeof adHocStatusEnum.enumValues)[number],
  researchBriefId?: string,
  failureReason?: string
) {
  const [request] = await db
    .update(adHocResearchRequests)
    .set({
      status,
      researchBriefId: researchBriefId || null,
      failureReason: failureReason || null,
      updatedAt: new Date(),
    })
    .where(eq(adHocResearchRequests.id, id))
    .returning();
  return request;
}

/**
 * Get pending ad-hoc research requests
 */
export async function getPendingAdHocResearchRequests() {
  return db.query.adHocResearchRequests.findMany({
    where: eq(adHocResearchRequests.status, "pending"),
    orderBy: [desc(adHocResearchRequests.createdAt)],
    with: {
      campaign: true,
    },
  });
}

/**
 * Delete an ad-hoc research request
 */
export async function deleteAdHocResearchRequest(id: string) {
  await db.delete(adHocResearchRequests).where(eq(adHocResearchRequests.id, id));
}
