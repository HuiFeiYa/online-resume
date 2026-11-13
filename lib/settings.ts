import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  return rows[0]?.value ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  const updatedAt = Date.now();
  await db
    .insert(schema.settings)
    .values({ key, value, updatedAt })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt },
    });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}