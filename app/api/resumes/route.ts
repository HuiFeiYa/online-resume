import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getTemplateBySlug, getTemplateById } from "@/lib/templates";
import { createResume, getUserResumes } from "@/lib/resume/store";
import { createDemoResume, createEmptyResume, resumeDataSchema } from "@/lib/resume/schema";
import { z } from "zod";

const createSchema = z.object({
  templateSlug: z.string().optional(),
  templateId: z.string().optional(),
  title: z.string().trim().max(60).optional(),
  demo: z.boolean().optional().default(false),
  data: resumeDataSchema.optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    return NextResponse.json({ resumes: await getUserResumes(user.id) });
  } catch (err) {
    return jsonError(err, "加载简历失败");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const input = parsed.data;
    const template = input.templateSlug
      ? await getTemplateBySlug(input.templateSlug)
      : input.templateId
        ? await getTemplateById(input.templateId)
        : await getTemplateBySlug("forest-editorial");
    if (!template || !template.editorEnabled) {
      return errorResponse("TEMPLATE_UNAVAILABLE", "该模板暂不支持在线编辑", 404);
    }
    const data = input.data ?? (input.demo ? createDemoResume() : createEmptyResume());
    const resume = await createResume(
      user.id,
      template.id,
      data,
      input.title || (data.basics.name ? `${data.basics.name}的简历` : "未命名简历"),
    );
    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    return jsonError(err, "创建简历失败");
  }
}