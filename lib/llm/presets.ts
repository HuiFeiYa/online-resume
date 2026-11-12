/**
 * LLM 多模型适配器 —— provider 预设表。
 * 各平台均走 OpenAI 兼容的 POST {baseUrl}/chat/completions + SSE，差异仅在
 * Base URL 与参数能力（不支持的能力由适配器自动过滤，避免 400）。
 *
 * 注意：本表【不提供默认模型】。模型名必须由环境变量 LLM_MODEL / QWEN_MODEL
 * 显式指定，缺失时调用直接报错、不产生任何请求，防止误用付费模型造成扣费。
 */
import type { ProviderId, ProviderPreset } from "./types";

export const PRESETS: Record<ProviderId, ProviderPreset> = {
  /** 阿里云百炼（通义千问）DashScope compatible-mode（示例模型需自行经环境变量配置） */
  qwen: {
    id: "qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    supports: {
      topP: true,
      frequencyPenalty: true,
      presencePenalty: true,
      enableThinking: true,
      webSearch: true,
    },
  },
  /** DeepSeek：不支持 frequency/presence penalty，需忽略 reasoning_content */
  deepseek: {
    id: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    supports: {
      topP: true,
      frequencyPenalty: false,
      presencePenalty: false,
      enableThinking: false,
    },
  },
  /** 智谱 GLM（open.bigmodel.cn v4 兼容 OpenAI 协议） */
  glm: {
    id: "glm",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    supports: {
      topP: true,
      frequencyPenalty: true,
      presencePenalty: true,
      enableThinking: false,
    },
  },
  /** 完全自定义：OpenAI 兼容任意端点（baseUrl/model 必须由环境变量提供） */
  "openai-compatible": {
    id: "openai-compatible",
    baseUrl: "",
    supports: {
      topP: true,
      frequencyPenalty: true,
      presencePenalty: true,
      enableThinking: false,
    },
  },
};
