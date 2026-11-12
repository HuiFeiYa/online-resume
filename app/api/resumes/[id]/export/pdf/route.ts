import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getUserResume } from "@/lib/resume/store";
import { getTemplateById } from "@/lib/templates";
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
    const resume = await getUserResume(user.id, id);
    if (!resume) return errorResponse("NOT_FOUND", "简历不存在", 404);
    await getTemplateById(resume.templateId);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const token = signResumePrintToken(user.id, id, expiresAt);
    const origin = new URL(req.url).origin;
    const url = `${origin}/print/resume/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;
    const pdf = await renderPrintUrlToPdf(url);
    const fileName = `${exportBaseName(resume.data, resume.title)}.pdf`;
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err, "PDF 导出失败");
  }
}