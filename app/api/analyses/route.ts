import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse } from "@/lib/auth/guard";
import { detectFileKind, extractDocumentText, MAX_FILE_BYTES } from "@/lib/documents/extract";
import { analyzeResumeWithAi } from "@/lib/analysis/ai";
import { assertLlmReady, getLlmConfig } from "@/lib/llm";
import { consumeQuota, getQuotaStatus, releaseQuota } from "@/lib/quota";
import { getDb, schema } from "@/db";
import { createId } from "@/lib/resume/schema";

export const runtime = "nodejs";
export const maxDuration = 300;

type AnalysisEvent =
  | { type: "stage"; stage: string; label: string; detail?: string }
  | { type: "progress"; stage: "analyzing"; chars: number }
  | { type: "retry"; stage: "analyzing"; message: string }
  | { type: "done"; id: string; kind: "resume"; report: unknown; sourceHash: string }
  | { type: "error"; code: string; message: string };

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);

  let file: File | null = null;
  let jd = "";
  try {
    const form = await req.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
    const jdValue = form.get("jd");
    jd = typeof jdValue === "string" ? jdValue.trim() : "";
  } catch {
    return errorResponse("VALIDATION_ERROR", "上传数据格式不正确");
  }

  if (!file) {
    return errorResponse("VALIDATION_ERROR", "请上传 DOCX 或 PDF 文件");
  }
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse("FILE_TOO_LARGE", "文件不能超过 10 MB", 413);
  }
  if (jd.length > 20000) {
    return errorResponse("VALIDATION_ERROR", "目标 JD 不能超过 20000 字符");
  }

  const name = file.name || "resume";
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectFileKind(bytes, name)) {
    return errorResponse("UNSUPPORTED_FILE", "仅支持 DOCX 或可选中文本的 PDF");
  }

  try {
    assertLlmReady(getLlmConfig());
  } catch (err) {
    return errorResponse(
      "AI_NOT_CONFIGURED",
      err instanceof Error ? err.message : "AI 分析未配置",
      503,
    );
  }

  const quotaStatus = await getQuotaStatus(user.id, "resume_analysis");
  if (!quotaStatus.vip && quotaStatus.remaining <= 0) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "今天的一次免费评分已用完，开通会员后可不限次数使用。",
      402,
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: AnalysisEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          } catch {
            closed = true;
          }
        }
      }, 15_000);

      let reservation: Awaited<ReturnType<typeof consumeQuota>> | null = null;
      try {
        send({
          type: "stage",
          stage: "quota",
          label: "正在确认今日额度",
          detail: quotaStatus.vip ? "会员不限次" : `剩余 ${quotaStatus.remaining} 次免费评分`,
        });
        const quota = await consumeQuota(user.id, "resume_analysis");
        if (!quota.ok) {
          send({
            type: "error",
            code: "QUOTA_EXCEEDED",
            message: "今天的一次免费评分已用完，开通会员后可不限次数使用。",
          });
          return;
        }
        reservation = quota;

        send({
          type: "stage",
          stage: "parsing",
          label: "正在解析简历文件",
          detail: name,
        });
        const text = await extractDocumentText(bytes, name);
        if (text.length < 80) {
          if (reservation?.reservationId) {
            await releaseQuota(user.id, "resume_analysis").catch(() => undefined);
          }
          send({
            type: "error",
            code: "NO_TEXT_LAYER",
            message: "没有提取到足够的文字。扫描版 PDF 暂不支持，请上传可复制文本的版本或 DOCX。",
          });
          return;
        }

        let lastSent = 0;
        const report = await analyzeResumeWithAi(text, jd, {
          signal: req.signal,
          onProgress: ({ chars, attempt }) => {
            if (chars - lastSent < 80) return;
            lastSent = chars;
            send({ type: "progress", stage: "analyzing", chars });
            if (attempt > 1) {
              send({ type: "stage", stage: "analyzing", label: "正在自动重试分析", detail: "上一轮输出不完整，重新生成" });
            }
          },
          onRetry: (message) => {
            lastSent = 0;
            send({
              type: "retry",
              stage: "analyzing",
              message: "首次输出不完整，正在用更紧凑的格式自动重试",
            });
            console.warn("[api/analyses] retrying model output:", message);
          },
        });

        send({
          type: "stage",
          stage: "validating",
          label: "正在校验 V2 评分规则",
          detail: "四个维度、七个子项已通过结构校验",
        });

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
          jdText: jd || null,
          resultJson: JSON.stringify(report),
          score: Math.round(report.overallScore),
          model: getLlmConfig().model,
          createdAt: now,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        });

        send({
          type: "stage",
          stage: "saving",
          label: "正在保存诊断报告",
          detail: `总分 ${report.overallScore} / 100`,
        });
        send({
          type: "done",
          id,
          kind: "resume",
          report,
          sourceHash: createHash("sha256").update(bytes).digest("hex").slice(0, 16),
        });
      } catch (err) {
        if (reservation?.reservationId) {
          await releaseQuota(user.id, "resume_analysis").catch(() => undefined);
        }
        console.error("[api/analyses]", err);
        send({
          type: "error",
          code: "ANALYSIS_FAILED",
          message: err instanceof Error ? err.message : "简历分析失败",
        });
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try {
          controller.close();
        } catch {
          // 客户端可能已主动断开。
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}