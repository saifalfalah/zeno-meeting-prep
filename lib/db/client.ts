import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create the Drizzle database instance with schema
export const db = drizzle(sql, { schema });
