import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getUserResume } from "@/lib/resume/store";
import { getTemplateById } from "@/lib/templates";
import { buildResumeDocx, exportBaseName } from "@/lib/documents/docx";
import { defaultTheme } from "@/lib/resume/schema";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const { id } = await params;
    const resume = await getUserResume(user.id, id);
    if (!resume) return errorResponse("NOT_FOUND", "简历不存在", 404);
    const template = await getTemplateById(resume.templateId);
    const buffer = await buildResumeDocx(
      resume.data,
      template?.theme || defaultTheme,
      template?.rendererKey || "classic",
    );
    const fileName = `${exportBaseName(resume.data, resume.title)}.docx`;
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err, "导出失败");
  }
}