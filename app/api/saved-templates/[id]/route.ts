import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser, jsonError } from "@/lib/auth/guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const db = await getDb();
    const existing = await db
      .select()
      .from(schema.savedTemplates)
      .where(
        and(
          eq(schema.savedTemplates.userId, auth.userId),
          eq(schema.savedTemplates.templateId, id),
        ),
      )
      .limit(1);
    if (!existing.length) {
      await db.insert(schema.savedTemplates).values({
        userId: auth.userId,
        templateId: id,
        createdAt: Date.now(),
      });
    }
    return NextResponse.json({ saved: true });
  } catch (err) {
    return jsonError(err, "收藏失败");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const db = await getDb();
    await db
      .delete(schema.savedTemplates)
      .where(
        and(
          eq(schema.savedTemplates.userId, auth.userId),
          eq(schema.savedTemplates.templateId, id),
        ),
      );
    return NextResponse.json({ saved: false });
  } catch (err) {
    return jsonError(err, "取消收藏失败");
  }
}