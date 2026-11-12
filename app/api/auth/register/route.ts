import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { setSessionCookie } from "@/lib/auth/session";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { createId } from "@/lib/resume/schema";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效邮箱"),
  password: z.string().min(8, "密码至少 8 位").max(72),
  displayName: z.string().trim().max(30).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const { email, password, displayName } = parsed.data;
    const db = await getDb();
    const exists = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (exists.length) {
      return errorResponse("EMAIL_TAKEN", "该邮箱已注册", 409);
    }
    const id = createId("u");
    const now = Date.now();
    await db.insert(schema.users).values({
      id,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      displayName: displayName || email.split("@")[0],
      role: "user",
      createdAt: now,
    });
    await setSessionCookie(id);
    return NextResponse.json({ user: { id, email, displayName: displayName || email.split("@")[0] } });
  } catch (err) {
    return jsonError(err, "注册失败");
  }
}