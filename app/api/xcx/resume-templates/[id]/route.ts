import { NextRequest, NextResponse } from "next/server";
import { getServerTemplate, RemoteTemplateError } from "@/lib/remote-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "非法的模板 ID" } },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json({ template: await getServerTemplate(id) });
  } catch (error) {
    if (error instanceof RemoteTemplateError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "NOT_FOUND" ? 404 : 502 },
      );
    }
    console.error("[api/xcx/resume-templates/:id]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "模板服务异常" } },
      { status: 500 },
    );
  }
}