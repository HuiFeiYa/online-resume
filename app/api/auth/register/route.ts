import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { setSessionCookie } from "@/lib/auth/session";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { createId } from "@/lib/resume/schema";
import { z } from "zod";

const bodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "昵称至少 2 个字符")
    .max(20, "昵称最多 20 个字符"),
  password: z.string().min(6, "密码至少 6 位").max(72),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const { username, password } = parsed.data;
    const db = await getDb();
    const exists = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    if (exists.length) {
      return errorResponse("USERNAME_TAKEN", "该昵称已被使用", 409);
    }
    const id = createId("u");
    await db.insert(schema.users).values({
      id,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      createdAt: Date.now(),
    });
    await setSessionCookie(id);
    return NextResponse.json({ user: { id, username } });
  } catch (err) {
    return jsonError(err, "注册失败");
  }
}