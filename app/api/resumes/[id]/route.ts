import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getUserResume } from "@/lib/resume/store";
import { normalizeResumeData, resumeDataSchema } from "@/lib/resume/schema";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
  data: resumeDataSchema.optional(),
  templateId: z.string().min(1).optional(),
  revision: z.number().int().positive().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const resume = await getUserResume(user.id, id);
    if (!resume) return errorResponse("NOT_FOUND", "简历不存在", 404);
    return NextResponse.json({ resume });
  } catch (err) {
    return jsonError(err, "加载简历失败");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const current = await getUserResume(user.id, id);
    if (!current) return errorResponse("NOT_FOUND", "简历不存在", 404);
    if (parsed.data.revision && parsed.data.revision !== current.revision) {
      return errorResponse("REVISION_CONFLICT", "简历已在其他窗口更新，请刷新后再试", 409);
    }
    const db = await getDb();
    const now = Date.now();
    const nextRevision = current.revision + 1;
    const nextData = normalizeResumeData(parsed.data.data ?? current.data);
    await db
      .update(schema.resumes)
      .set({
        title: parsed.data.title ?? current.title,
        templateId: parsed.data.templateId ?? current.templateId,
        dataJson: JSON.stringify(nextData),
        revision: nextRevision,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.resumes.id, id),
          eq(schema.resumes.userId, user.id),
          eq(schema.resumes.revision, current.revision),
        ),
      );
    if (nextRevision % 20 === 0) {
      await db.insert(schema.resumeVersions).values({
        id: `rv-${crypto.randomUUID()}`,
        resumeId: id,
        dataJson: JSON.stringify(nextData),
        label: "自动保存",
        createdAt: now,
      });
    }
    return NextResponse.json({
      revision: nextRevision,
      updatedAt: now,
      title: parsed.data.title ?? current.title,
    });
  } catch (err) {
    return jsonError(err, "保存简历失败");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const db = await getDb();
    await db
      .delete(schema.resumes)
      .where(and(eq(schema.resumes.id, id), eq(schema.resumes.userId, user.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err, "删除简历失败");
  }
}