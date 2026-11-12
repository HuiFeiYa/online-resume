import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getTemplateBySlug, incrementTemplateDownload } from "@/lib/templates";
import { buildResumeDocx, safeDocxName } from "@/lib/documents/docx";
import { createDemoResume } from "@/lib/resume/schema";
import { createHash } from "node:crypto";

const buckets = new Map<string, { count: number; resetAt: number }>();

function allowDownload(ip: string): boolean {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 30) return false;
  current.count += 1;
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (!allowDownload(ip)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "下载过于频繁，请稍后再试" } },
      { status: 429 },
    );
  }

  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "模板不存在或已下架" } },
      { status: 404 },
    );
  }

  const data = createDemoResume();
  data.basics.name = "简历示例";
  data.basics.jobTitle = template.title;
  const bytes = await buildResumeDocx(data, template.theme);
  await incrementTemplateDownload(template.id);
  const db = await getDb();
  await db.insert(schema.downloadEvents).values({
    templateId: template.id,
    userHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
    createdAt: Date.now(),
  });

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeDocxName(template.title))}`,
      "Cache-Control": "no-store",
    },
  });
}