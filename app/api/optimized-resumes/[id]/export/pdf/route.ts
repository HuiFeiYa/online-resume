import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getOptimizedResume } from "@/lib/analysis/optimized-store";
import { getTemplateBySlug } from "@/lib/templates";
import { renderPrintUrlToPdf } from "@/lib/documents/pdf";
import { exportBaseName } from "@/lib/documents/docx";
import { signResumePrintToken } from "@/lib/documents/print-token";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const token = signResumePrintToken(user.id, id, expiresAt, "optimized");
    const origin = new URL(req.url).origin;
    const template = req.nextUrl.searchParams.get("template") || "forest-editorial";
    const url = `${origin}/print/optimized/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}&template=${encodeURIComponent(template)}`;
    const pdf = await renderPrintUrlToPdf(url);
    const fileName = `${exportBaseName(optimized.data, optimized.title)}.pdf`;
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err, "导出优化版 PDF 失败");
  }
}