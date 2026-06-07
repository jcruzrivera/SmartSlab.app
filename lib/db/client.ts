import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

export type Database = ReturnType<typeof createDb>;

let cached: Database | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function createDb(databaseUrl: string) {
  return drizzle({ client: neon(databaseUrl), schema });
}

export function getDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize the database client.");
  }

  if (!cached) {
    cached = createDb(databaseUrl);
  }

  return cached;
}
