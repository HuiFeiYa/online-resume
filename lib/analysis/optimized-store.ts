import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalizeResumeData, type ResumeData } from "@/lib/resume/schema";
import type { OptimizationChange } from "@/lib/analysis/optimize";

export type OptimizedResumeRecord = {
  id: string;
  analysisId: string;
  sourceResumeId: string | null;
  title: string;
  data: ResumeData;
  changes: OptimizationChange[];
  model: string;
  createdAt: number;
};

function parseChanges(value: string): OptimizationChange[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toRecord(row: typeof schema.optimizedResumes.$inferSelect): OptimizedResumeRecord | null {
  try {
    return {
      id: row.id,
      analysisId: row.analysisId,
      sourceResumeId: row.sourceResumeId,
      title: row.title,
      data: normalizeResumeData(JSON.parse(row.dataJson)),
      changes: parseChanges(row.changesJson),
      model: row.model,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

export async function createOptimizedResume(input: {
  userId: string;
  analysisId: string;
  sourceResumeId?: string | null;
  title: string;
  data: ResumeData;
  changes: OptimizationChange[];
  model: string;
}) {
  const db = await getDb();
  const id = `opt-${crypto.randomUUID()}`;
  const now = Date.now();
  const normalized = normalizeResumeData(input.data);
  await db.insert(schema.optimizedResumes).values({
    id,
    userId: input.userId,
    analysisId: input.analysisId,
    sourceResumeId: input.sourceResumeId || null,
    title: input.title,
    dataJson: JSON.stringify(normalized),
    changesJson: JSON.stringify(input.changes),
    model: input.model,
    createdAt: now,
  });
  return { id, createdAt: now, data: normalized };
}

export async function getOptimizedResume(
  userId: string,
  id: string,
): Promise<OptimizedResumeRecord | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.optimizedResumes)
    .where(and(eq(schema.optimizedResumes.id, id), eq(schema.optimizedResumes.userId, userId)))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function getOptimizedResumeByAnalysis(
  userId: string,
  analysisId: string,
): Promise<OptimizedResumeRecord | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.optimizedResumes)
    .where(
      and(
        eq(schema.optimizedResumes.userId, userId),
        eq(schema.optimizedResumes.analysisId, analysisId),
      ),
    )
    .orderBy(desc(schema.optimizedResumes.createdAt))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function listOptimizedResumes(userId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.optimizedResumes)
    .where(eq(schema.optimizedResumes.userId, userId))
    .orderBy(desc(schema.optimizedResumes.createdAt));
  return rows.map(toRecord).filter((item): item is OptimizedResumeRecord => Boolean(item));
}

export async function updateOptimizedResume(
  userId: string,
  id: string,
  data: ResumeData,
): Promise<boolean> {
  const db = await getDb();
  await db
    .update(schema.optimizedResumes)
    .set({ dataJson: JSON.stringify(normalizeResumeData(data)) })
    .where(and(eq(schema.optimizedResumes.id, id), eq(schema.optimizedResumes.userId, userId)));
  return Boolean(await getOptimizedResume(userId, id));
}