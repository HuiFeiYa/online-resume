import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getOptimizedResume, updateOptimizedResume } from "@/lib/analysis/optimized-store";
import { resumeDataSchema } from "@/lib/resume/schema";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const optimized = await getOptimizedResume(user.id, id);
    if (!optimized) return errorResponse("NOT_FOUND", "优化版简历不存在", 404);
    return NextResponse.json({ optimized });
  } catch (err) {
    return jsonError(err, "加载优化版简历失败");
  }
}

const patchSchema = z.object({ data: resumeDataSchema });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "简历内容无效");
    }
    const ok = await updateOptimizedResume(user.id, id, parsed.data.data);
    if (!ok) return errorResponse("NOT_FOUND", "优化版简历不存在", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err, "保存优化版简历失败");
  }
}