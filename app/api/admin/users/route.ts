import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { setUserVip, getQuotaStatus } from "@/lib/quota";
import { z } from "zod";

export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== "admin") return errorResponse("FORBIDDEN", "没有权限", 403);
    const db = await getDb();
    const users = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        role: schema.users.role,
        isVip: schema.users.isVip,
        vipExpiresAt: schema.users.vipExpiresAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(200);
    const counts = await db.select().from(schema.usageCounters);
    return NextResponse.json({
      users: users.map((item) => {
        const rows = counts.filter(
          (row) => row.subjectHash === item.id && row.action === "resume_analysis",
        );
        const used = rows.reduce((sum, row) => sum + row.count, 0);
        return { ...item, analysesUsed: used };
      }),
    });
  } catch (err) {
    return jsonError(err, "加载用户失败");
  }
}

const vipSchema = z.object({
  userId: z.string().min(1),
  isVip: z.boolean(),
  vipExpiresAt: z.number().int().positive().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== "admin") return errorResponse("FORBIDDEN", "没有权限", 403);
    const parsed = vipSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorResponse("VALIDATION_ERROR", "参数无效");
    await setUserVip(
      parsed.data.userId,
      parsed.data.isVip,
      parsed.data.vipExpiresAt ?? null,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err, "更新会员失败");
  }
}