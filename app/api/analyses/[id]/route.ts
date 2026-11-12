import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getAnalysisForUser } from "@/lib/analysis/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const analysis = await getAnalysisForUser(user.id, id);
    if (!analysis) return errorResponse("NOT_FOUND", "报告不存在", 404);
    return NextResponse.json({ analysis });
  } catch (err) {
    return jsonError(err, "加载报告失败");
  }
}