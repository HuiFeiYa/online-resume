import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { setSessionCookie } from "@/lib/auth/session";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码").max(72),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return errorResponse("INVALID_CREDENTIALS", "邮箱或密码不正确", 401);
    }
    await setSessionCookie(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    return jsonError(err, "登录失败");
  }
}