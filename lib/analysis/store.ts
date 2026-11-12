import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function getAnalysisForUser(userId: string, id: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.analysisJobs)
    .where(and(eq(schema.analysisJobs.id, id), eq(schema.analysisJobs.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    result: row.resultJson ? JSON.parse(row.resultJson) : null,
  };
}