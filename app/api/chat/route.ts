import { streamChat } from "@/lib/llm";
import type { LLMMessage } from "@/lib/llm";
import { NextRequest, NextResponse } from "next/server";

// 大模型流式调用需 Node 运行时（用到全局 fetch / Web Crypto）
export const runtime = "nodejs";

/**
 * 最小示例：接收 messages，以 SSE 流式返回 LLM 增量。
 * 请求体：{ "messages": [{ "role": "user", "content": "你好" }] }
 */
export async function POST(req: NextRequest) {
  let messages: LLMMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages 必须是数组" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamChat({ messages })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "未知错误";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
