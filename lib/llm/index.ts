/**
 * LLM 多模型适配器 —— 统一入口（业务路由只依赖本文件导出的接口）。
 *
 * 切换平台只需改环境变量，代码零改动：
 *   LLM_PROVIDER=qwen|deepseek|glm|openai-compatible
 *   LLM_API_KEY / LLM_BASE_URL / LLM_MODEL / LLM_STRONG_MODEL（可选）
 * API_KEY / BASE_URL 缺省时自动回退 QWEN_API_KEY / QWEN_BASE_URL；
 * 模型名【没有代码默认值】：必须显式配置 LLM_MODEL 或 QWEN_MODEL，均缺失时
 * assertLlmReady 直接抛错、不发起任何调用，防止误用付费模型造成扣费。
 */
import { PRESETS } from "./presets";
import {
  chatComplete as chatCompleteCore,
  streamChat as streamChatCore,
} from "./openai-compatible";
import type { LLMStreamParams, LlmConfig, ProviderId } from "./types";

export type { LLMMessage, LLMStreamParams } from "./types";

/** 解析运行时配置（不缓存：开发时改环境变量重启即可生效） */
export function getLlmConfig(): LlmConfig {
  const raw = (process.env.LLM_PROVIDER || "qwen").trim().toLowerCase();
  const preset = PRESETS[raw as ProviderId] ?? PRESETS.qwen;

  const apiKey = process.env.LLM_API_KEY || process.env.QWEN_API_KEY || "";
  const baseUrl = (
    process.env.LLM_BASE_URL ||
    process.env.QWEN_BASE_URL ||
    preset.baseUrl
  ).replace(/\/+$/, "");
  const model = process.env.LLM_MODEL || process.env.QWEN_MODEL || "";
  const strongModel = process.env.LLM_STRONG_MODEL || model;

  return { ...preset, apiKey, baseUrl, model, strongModel };
}

/** 校验配置是否就绪；缺失时抛出带指引的错误 */
export function assertLlmReady(cfg: LlmConfig): void {
  if (!cfg.apiKey) {
    throw new Error("未配置模型 API Key（LLM_API_KEY 或 QWEN_API_KEY）");
  }
  if (!cfg.baseUrl) {
    throw new Error("未配置模型 Base URL（LLM_BASE_URL 或 QWEN_BASE_URL）");
  }
  if (!cfg.model) {
    throw new Error("未配置模型名称（LLM_MODEL 或 QWEN_MODEL）");
  }
}

/**
 * 流式调用：逐 delta 产出正文增量（思维链已过滤）。
 * 路由层将每个 delta 编码为 SSE 事件转发给前端。
 */
export async function* streamChat(
  params: LLMStreamParams,
): AsyncGenerator<string> {
  const cfg = getLlmConfig();
  assertLlmReady(cfg);
  for await (const delta of streamChatCore(cfg, params)) {
    yield delta.content;
  }
}

/** 完整调用：内部 collect 全文后返回（用于原创度检测 / 重写等场景） */
export async function chatComplete(params: LLMStreamParams): Promise<string> {
  const cfg = getLlmConfig();
  assertLlmReady(cfg);
  return chatCompleteCore(cfg, params);
}
