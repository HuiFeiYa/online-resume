import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createEmptyResume, createId, resumeDataSchema, type ResumeData } from "@/lib/resume/schema";

export type ResumeRecord = {
  id: string;
  title: string;
  templateId: string;
  data: ResumeData;
  revision: number;
  updatedAt: number;
};

export async function getUserResumes(userId: string): Promise<ResumeRecord[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.resumes)
    .where(eq(schema.resumes.userId, userId))
    .orderBy(desc(schema.resumes.updatedAt));
  return rows.map((row) => {
    let data = createEmptyResume();
    try {
      const parsed = resumeDataSchema.safeParse(JSON.parse(row.dataJson));
      if (parsed.success) data = parsed.data;
    } catch {
      // Keep a valid empty resume if old data cannot be parsed.
    }
    return {
      id: row.id,
      title: row.title,
      templateId: row.templateId,
      data,
      revision: row.revision,
      updatedAt: row.updatedAt,
    };
  });
}

export async function getUserResume(userId: string, id: string): Promise<ResumeRecord | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.resumes)
    .where(and(eq(schema.resumes.id, id), eq(schema.resumes.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = resumeDataSchema.safeParse(JSON.parse(row.dataJson));
  if (!parsed.success) return null;
  return {
    id: row.id,
    title: row.title,
    templateId: row.templateId,
    data: parsed.data,
    revision: row.revision,
    updatedAt: row.updatedAt,
  };
}

export async function createResume(
  userId: string,
  templateId: string,
  data = createEmptyResume(),
  title = "我的简历",
): Promise<ResumeRecord> {
  const db = await getDb();
  const now = Date.now();
  const record: ResumeRecord = {
    id: createId("r"),
    title,
    templateId,
    data,
    revision: 1,
    updatedAt: now,
  };
  await db.insert(schema.resumes).values({
    id: record.id,
    userId,
    templateId,
    title,
    dataJson: JSON.stringify(data),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
  return record;
}