import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { detectFileKind, extractDocumentText, MAX_FILE_BYTES } from "@/lib/documents/extract";
import { analyzeResumeSmart } from "@/lib/analysis/ai";
import { getDb, schema } from "@/db";
import { createId } from "@/lib/resume/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse("VALIDATION_ERROR", "请上传 DOCX 或 PDF 文件");
    }
    if (file.size > MAX_FILE_BYTES) {
      return errorResponse("FILE_TOO_LARGE", "文件不能超过 10 MB", 413);
    }
    const name = file.name || "resume";
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!detectFileKind(bytes, name)) {
      return errorResponse("UNSUPPORTED_FILE", "仅支持 DOCX 或可选中文本的 PDF");
    }
    const text = await extractDocumentText(bytes, name);
    if (text.length < 80) {
      return errorResponse(
        "NO_TEXT_LAYER",
        "没有提取到足够的文字。扫描版 PDF 暂不支持，请上传可复制文本的版本或 DOCX。",
      );
    }
    const result = await analyzeResumeSmart(text);
    const db = await getDb();
    const id = createId("a");
    const now = Date.now();
    await db.insert(schema.analysisJobs).values({
      id,
      userId: user.id,
      kind: "resume",
      status: "completed",
      fileName: name,
      fileKey: null,
      extractedText: text.slice(0, 30000),
      jdText: null,
      resultJson: JSON.stringify(result),
      score: result.overallScore,
      model: process.env.LLM_MODEL || "local-heuristic",
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    return NextResponse.json({
      id,
      kind: "resume",
      report: result,
      sourceHash: createHash("sha256").update(bytes).digest("hex").slice(0, 16),
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNSUPPORTED_FILE" || err.message === "NO_TEXT_LAYER")) {
      return errorResponse(err.message, "文件解析失败，请换一个文件重试");
    }
    return jsonError(err, "简历分析失败");
  }
}