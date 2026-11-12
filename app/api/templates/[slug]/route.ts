import { NextRequest, NextResponse } from "next/server";
import { getTemplateBySlug } from "@/lib/templates";
import { jsonError } from "@/lib/auth/guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const template = await getTemplateBySlug(slug);
    if (!template) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "模板不存在" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ template });
  } catch (err) {
    return jsonError(err, "加载模板失败");
  }
}