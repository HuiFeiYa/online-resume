import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse } from "@/lib/auth/guard";
import { getAnalysisForUser } from "@/lib/analysis/store";
import { optimizeResumeWithAi } from "@/lib/analysis/optimize";
import { createOptimizedResume } from "@/lib/analysis/optimized-store";
import { assertLlmReady, getLlmConfig } from "@/lib/llm";
import { consumeQuota, getQuotaStatus, releaseQuota } from "@/lib/quota";
import type { ResumeAnalysisReport } from "@/lib/analysis/v2";

export const runtime = "nodejs";
export const maxDuration = 300;

type OptimizeEvent =
  | { type: "stage"; stage: string; label: string; detail?: string }
  | { type: "progress"; chars: number }
  | { type: "done"; id: string; title: string }
  | { type: "error"; code: string; message: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
  const { id } = await params;
  const analysis = await getAnalysisForUser(user.id, id);
  if (!analysis) return errorResponse("NOT_FOUND", "诊断报告不存在", 404);
  const result = analysis.result as ResumeAnalysisReport;

  try {
    assertLlmReady(getLlmConfig());
  } catch (err) {
    return errorResponse(
      "AI_NOT_CONFIGURED",
      err instanceof Error ? err.message : "AI 优化未配置",
      503,
    );
  }

  const quotaStatus = await getQuotaStatus(user.id, "resume_optimize");
  if (!quotaStatus.vip && quotaStatus.remaining <= 0) {
    return errorResponse(
      "QUOTA_EXCEEDED",
      "今天的一次免费优化已用完，开通会员后可不限次数使用。",
      402,
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: OptimizeEvent) => {
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
          label: "正在确认优化额度",
          detail: quotaStatus.vip ? "会员不限次" : `剩余 ${quotaStatus.remaining} 次免费优化`,
        });
        const quota = await consumeQuota(user.id, "resume_optimize");
        if (!quota.ok) {
          send({
            type: "error",
            code: "QUOTA_EXCEEDED",
            message: "今天的一次免费优化已用完，开通会员后可不限次数使用。",
          });
          return;
        }
        reservation = quota;

        send({
          type: "stage",
          stage: "reading",
          label: "正在读取简历与诊断建议",
          detail: `基础分 ${result.overallScore} / 100`,
        });
        const advice = [
          result.summary,
          ...result.issues.map((issue) =>
            `[${issue.severity}] ${issue.section}: ${issue.issue} -> ${issue.suggestion}${issue.rewrite ? `；参考改写：${issue.rewrite}` : ""}`,
          ),
          ...result.quickWins,
        ].join("\n");

        send({
          type: "stage",
          stage: "optimizing",
          label: "大模型正在重写简历",
          detail: "保留事实，只优化结构与表达",
        });
        let lastSent = 0;
        const optimized = await optimizeResumeWithAi(
          `${analysis.extractedText || ""}\n\n【诊断建议】\n${advice}`,
          analysis.jdText || "",
          {
            signal: req.signal,
            onProgress: (chars) => {
              if (chars - lastSent < 80) return;
              lastSent = chars;
              send({ type: "progress", chars });
            },
          },
        );

        send({
          type: "stage",
          stage: "saving",
          label: "正在保存优化版简历",
          detail: `${optimized.changes.length} 处重点优化`,
        });
        const title = `${analysis.fileName.replace(/\.(docx|pdf)$/i, "") || "我的"} · 优化版`;
        const saved = await createOptimizedResume({
          userId: user.id,
          analysisId: analysis.id,
          title,
          data: optimized.resume,
          changes: optimized.changes,
          model: getLlmConfig().model,
        });
        send({ type: "done", id: saved.id, title });
      } catch (err) {
        if (reservation?.reservationId) {
          await releaseQuota(user.id, "resume_optimize").catch(() => undefined);
        }
        console.error("[api/analyses/optimize]", err);
        send({
          type: "error",
          code: "OPTIMIZE_FAILED",
          message: err instanceof Error ? err.message : "简历优化失败",
        });
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try {
          controller.close();
        } catch {
          // Client disconnected.
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