import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getOptimizedResume } from "@/lib/analysis/optimized-store";
import { getTemplateBySlug } from "@/lib/templates";
import { buildResumeDocx, exportBaseName } from "@/lib/documents/docx";
import { defaultTheme } from "@/lib/resume/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const optimized = await getOptimizedResume(user.id, id);
    if (!optimized) return errorResponse("NOT_FOUND", "优化版简历不存在", 404);
    const requestedSlug = req.nextUrl.searchParams.get("template") || "forest-editorial";
    const template = await getTemplateBySlug(requestedSlug);
    const buffer = await buildResumeDocx(
      optimized.data,
      template?.theme || defaultTheme,
      template?.rendererKey || "classic",
    );
    const fileName = `${exportBaseName(optimized.data, optimized.title)}.docx`;
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err, "导出优化版简历失败");
  }
}