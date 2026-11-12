import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { createId } from "@/lib/resume/schema";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(1, "请填写称呼").max(30),
  contactType: z.enum(["wechat", "phone", "email"]).default("wechat"),
  contactValue: z.string().trim().min(3, "请填写联系方式").max(100),
  targetRole: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const user = await getSessionUser();
    const db = await getDb();
    await db.insert(schema.consultationLeads).values({
      id: createId("lead"),
      userId: user?.id || null,
      name: parsed.data.name,
      contactType: parsed.data.contactType,
      contactValue: parsed.data.contactValue,
      targetRole: parsed.data.targetRole || "",
      message: parsed.data.message || "",
      status: "new",
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err, "提交失败");
  }
}