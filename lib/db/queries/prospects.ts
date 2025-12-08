import { eq } from "drizzle-orm";
import { db } from "../client";
import { prospects } from "../schema";

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;

/**
 * Get a prospect by email
 */
export async function getProspectByEmail(email: string) {
  return db.query.prospects.findFirst({
    where: eq(prospects.email, email),
    with: {
      company: true,
    },
  });
}

/**
 * Get a prospect by ID
 */
export async function getProspectById(id: string) {
  return db.query.prospects.findFirst({
    where: eq(prospects.id, id),
    with: {
      company: true,
      meetingProspects: {
        with: {
          meeting: true,
        },
      },
    },
  });
}

/**
 * Get prospects by company ID
 */
export async function getProspectsByCompanyId(companyId: string) {
  return db.query.prospects.findMany({
    where: eq(prospects.companyId, companyId),
  });
}

/**
 * Create a new prospect
 */
export async function createProspect(data: NewProspect) {
  const [prospect] = await db.insert(prospects).values(data).returning();
  return prospect;
}

/**
 * Update a prospect
 */
export async function updateProspect(id: string, data: Partial<NewProspect>) {
  const [prospect] = await db
    .update(prospects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(prospects.id, id))
    .returning();
  return prospect;
}

/**
 * Upsert a prospect by email
 */
export async function upsertProspectByEmail(email: string, data: Partial<NewProspect>) {
  const existing = await getProspectByEmail(email);

  if (existing) {
    return updateProspect(existing.id, data);
  }

  return createProspect({ email, ...data } as NewProspect);
}
