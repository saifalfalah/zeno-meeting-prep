import { eq } from "drizzle-orm";
import { db } from "../client";
import { companies } from "../schema";

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

/**
 * Get a company by domain
 */
export async function getCompanyByDomain(domain: string) {
  return db.query.companies.findFirst({
    where: eq(companies.domain, domain),
    with: {
      prospects: true,
    },
  });
}

/**
 * Get a company by ID
 */
export async function getCompanyById(id: string) {
  return db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: {
      prospects: true,
    },
  });
}

/**
 * Create a new company
 */
export async function createCompany(data: NewCompany) {
  const [company] = await db.insert(companies).values(data).returning();
  return company;
}

/**
 * Update a company
 */
export async function updateCompany(id: string, data: Partial<NewCompany>) {
  const [company] = await db
    .update(companies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return company;
}

/**
 * Upsert a company by domain
 */
export async function upsertCompanyByDomain(domain: string, data: Partial<NewCompany>) {
  const existing = await getCompanyByDomain(domain);

  if (existing) {
    return updateCompany(existing.id, data);
  }

  return createCompany({ domain, ...data } as NewCompany);
}
