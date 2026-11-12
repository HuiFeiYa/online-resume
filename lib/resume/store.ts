import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  createEmptyResume,
  createId,
  normalizeResumeData,
  type ResumeData,
} from "@/lib/resume/schema";

export type ResumeRecord = {
  id: string;
  title: string;
  templateId: string;
  data: ResumeData;
  revision: number;
  updatedAt: number;
};

function parseStoredResume(value: string): ResumeData | null {
  try {
    return normalizeResumeData(JSON.parse(value));
  } catch {
    return null;
  }
}

export async function getUserResumes(userId: string): Promise<ResumeRecord[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.resumes)
    .where(eq(schema.resumes.userId, userId))
    .orderBy(desc(schema.resumes.updatedAt));
  return rows.map((row) => {
    const data = parseStoredResume(row.dataJson) || createEmptyResume();
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
  const data = parseStoredResume(row.dataJson);
  if (!data) return null;
  return {
    id: row.id,
    title: row.title,
    templateId: row.templateId,
    data,
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
  const normalized = normalizeResumeData(data);
  const record: ResumeRecord = {
    id: createId("r"),
    title,
    templateId,
    data: normalized,
    revision: 1,
    updatedAt: now,
  };
  await db.insert(schema.resumes).values({
    id: record.id,
    userId,
    templateId,
    title,
    dataJson: JSON.stringify(normalized),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
  return record;
}