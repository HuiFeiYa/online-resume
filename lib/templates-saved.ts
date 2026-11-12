import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function isTemplateSaved(userId: string, templateId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .select({ templateId: schema.savedTemplates.templateId })
    .from(schema.savedTemplates)
    .where(
      and(
        eq(schema.savedTemplates.userId, userId),
        eq(schema.savedTemplates.templateId, templateId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}