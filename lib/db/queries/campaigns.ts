import { eq, and, desc } from "drizzle-orm";
import { db } from "../client";
import { campaigns, type campaignStatusEnum } from "../schema";

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

/**
 * Get all campaigns for a user
 */
export async function getCampaignsByUserId(userId: string) {
  return db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
    orderBy: [desc(campaigns.createdAt)],
  });
}

/**
 * Get active campaigns for a user
 */
export async function getActiveCampaignsByUserId(userId: string) {
  return db.query.campaigns.findMany({
    where: and(eq(campaigns.userId, userId), eq(campaigns.status, "active")),
    orderBy: [desc(campaigns.createdAt)],
  });
}

/**
 * Get a campaign by ID
 */
export async function getCampaignById(id: string) {
  return db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: {
      webhookSubscription: true,
    },
  });
}

/**
 * Get a campaign by Google Calendar ID
 */
export async function getCampaignByCalendarId(userId: string, googleCalendarId: string) {
  return db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.userId, userId),
      eq(campaigns.googleCalendarId, googleCalendarId)
    ),
  });
}

/**
 * Create a new campaign
 */
export async function createCampaign(data: NewCampaign) {
  const [campaign] = await db.insert(campaigns).values(data).returning();
  return campaign;
}

/**
 * Update a campaign
 */
export async function updateCampaign(id: string, data: Partial<NewCampaign>) {
  const [campaign] = await db
    .update(campaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  return campaign;
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  id: string,
  status: (typeof campaignStatusEnum.enumValues)[number]
) {
  const [campaign] = await db
    .update(campaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  return campaign;
}
