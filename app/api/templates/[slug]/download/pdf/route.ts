import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getDb, schema } from "@/db";
import { getTemplateBySlug, incrementTemplateDownload } from "@/lib/templates";
import { createShowcaseResume } from "@/lib/resume/showcase";
import { renderPrintUrlToPdf } from "@/lib/documents/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "模板不存在或已下架" } },
      { status: 404 },
    );
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const origin = new URL(req.url).origin;
  const url = `${origin}/print/template/${encodeURIComponent(slug)}`;
  const pdf = await renderPrintUrlToPdf(url);
  await incrementTemplateDownload(template.id);
  const db = await getDb();
  await db.insert(schema.downloadEvents).values({
    templateId: template.id,
    userHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
    createdAt: Date.now(),
  });
  const fileName = `${template.title}.pdf`;
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}