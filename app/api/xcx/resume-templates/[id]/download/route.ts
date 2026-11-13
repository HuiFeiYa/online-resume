import { NextRequest, NextResponse } from "next/server";
import { downloadServerTemplate, RemoteTemplateError } from "@/lib/remote-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const upstream = await downloadServerTemplate(id);
    const contentType =
      upstream.headers.get("content-type") ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const disposition =
      upstream.headers.get("content-disposition") ||
      `attachment; filename*=UTF-8''${encodeURIComponent(`简历模板-${id}.docx`)}`;
    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    if (error instanceof RemoteTemplateError) {
      const status =
        error.code === "DOWNLOAD_FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : 502;
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status },
      );
    }
    console.error("[api/xcx/resume-templates/:id/download]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "下载失败，请稍后重试" } },
      { status: 500 },
    );
  }
}