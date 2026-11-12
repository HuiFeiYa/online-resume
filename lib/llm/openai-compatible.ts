/**
 * LLM 多模型适配器 —— OpenAI 兼容协议核心实现。
 * 统一以 POST {baseUrl}/chat/completions + stream=true 调用，逐 delta 产出文本；
 * 自动按 provider 能力过滤不支持的请求参数，SSE 解析时跳过空行 / [DONE] /
 * delta.reasoning_content（思维链内容，不推送给业务层）。
 */
import type { LLMStreamParams, LlmConfig } from "./types";

/** 单次调用产生的文本增量 */
export interface LlmDelta {
  /** 内容增量（reasoning_content 等思维链已被过滤） */
  content: string;
}

/** 构造请求体：按 provider 能力过滤不支持的参数 */
function buildBody(cfg: LlmConfig, params: LLMStreamParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: params.model ?? cfg.model,
    messages: params.messages,
    stream: true,
  };

  if (params.temperature !== undefined) body.temperature = params.temperature;
  if (params.maxTokens !== undefined) body.max_tokens = params.maxTokens;

  if (params.topP !== undefined && cfg.supports.topP) body.top_p = params.topP;
  if (params.frequencyPenalty !== undefined && cfg.supports.frequencyPenalty) {
    body.frequency_penalty = params.frequencyPenalty;
  }
  if (params.presencePenalty !== undefined && cfg.supports.presencePenalty) {
    body.presence_penalty = params.presencePenalty;
  }
  if (params.enableThinking !== undefined && cfg.supports.enableThinking) {
    body.enable_thinking = params.enableThinking;
  }
  // 联网检索：仅对支持该能力的 provider（当前为百炼 qwen）注入 enable_search；
  // 模型不支持或 provider 未声明时自动忽略，不影响普通调用
  if (params.webSearch && cfg.supports.webSearch) {
    body.enable_search = true;
    body.search_options = {
      forced_search: true,
      search_strategy: "max",
    };
  }

  return body;
}

/** 解析单行 SSE data：提取内容增量，过滤思维链；无法解析返回 null */
function parseDataLine(dataStr: string): string | null {
  if (dataStr === "[DONE]") return null;
  try {
    const parsed = JSON.parse(dataStr);
    const delta = parsed?.choices?.[0]?.delta;
    if (!delta) return null;
    const content = delta.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } catch {
    return null; // 跳过无法解析的行
  }
}

/**
 * 调用 OpenAI 兼容 /chat/completions 并逐 delta 产出正文增量。
 * 调用方（路由）负责把每个 delta 编码为 SSE 事件推给前端。
 * 失败时抛出带服务端状态码的 Error。
 */
export async function* streamChat(
  cfg: LlmConfig,
  params: LLMStreamParams,
): AsyncGenerator<LlmDelta> {
  const body = buildBody(cfg, params);

  // 超时/中断控制：
  // - callerSignal：用户点「停止」或服务端中止，立即中断底层 fetch。
  // - timeoutMs：空闲（首字前或流中间长时间无新数据）超时则主动 abort 并抛错，
  //   避免模型静默不吐字 / 弱网断连导致流永久挂起。
  const timeoutMs = params.timeoutMs;
  const callerSignal = params.signal;
  const controller = new AbortController();
  let abortedByTimeout = false;
  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onCallerAbort);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (callerSignal) callerSignal.removeEventListener("abort", onCallerAbort);
  };
  const armTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    if (!timeoutMs || timeoutMs <= 0) return;
    timer = setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, timeoutMs);
  };
  armTimer(); // 首字前的空闲超时

  let resp: Response;
  try {
    resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    clearTimer();
    throw new Error(
      controller.signal.aborted
        ? abortedByTimeout
          ? "模型响应超时，请重试"
          : "已取消生成"
        : "AI 服务请求失败",
    );
  }

  if (controller.signal.aborted) {
    clearTimer();
    throw new Error("模型响应超时，请重试");
  }
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    clearTimer();
    throw new Error(`AI 服务异常 (${resp.status}): ${errText.slice(0, 300)}`);
  }
  if (!resp.body) {
    clearTimer();
    throw new Error("AI 服务返回空响应");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (controller.signal.aborted) {
        throw new Error(
          abortedByTimeout ? "模型响应超时，请重试" : "已取消生成",
        );
      }
      let done = false;
      let value: Uint8Array | undefined;
      try {
        const res = await reader.read();
        done = res.done;
        value = res.value;
      } catch (err) {
        if (controller.signal.aborted) {
          throw new Error(
            abortedByTimeout ? "模型响应超时，请重试" : "已取消生成",
          );
        }
        throw err;
      }
      if (done) break;
      armTimer(); // 收到新数据，重置空闲超时

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const content = parseDataLine(trimmed.slice(6));
        if (content) yield { content };
      }
    }

    const leftover = buffer.trim();
    if (leftover.startsWith("data: ")) {
      const content = parseDataLine(leftover.slice(6));
      if (content) yield { content };
    }
  } finally {
    clearTimer();
    reader.releaseLock();
  }
}

/** 完整收集一次调用的全文（供原创度检测 / 重写等内部逻辑使用） */
export async function chatComplete(
  cfg: LlmConfig,
  params: LLMStreamParams,
): Promise<string> {
  let full = "";
  for await (const delta of streamChat(cfg, params)) {
    full += delta.content;
  }
  return full;
}
