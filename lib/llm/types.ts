/**
 * LLM 多模型适配器 —— 统一类型定义。
 * 通义千问（DashScope compatible-mode）、DeepSeek、GLM（智谱）均兼容 OpenAI
 * chat/completions 协议与 SSE 流式格式，因此统一抽象为一套参数契约。
 */

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/** 流式/完整调用的统一参数（不同 provider 不支持的字段会自动过滤） */
export interface LLMStreamParams {
  messages: LLMMessage[];
  /** 覆盖默认模型（如重写用强模型） */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  /** deepseek 不支持，自动过滤 */
  frequencyPenalty?: number;
  /** deepseek 不支持，自动过滤 */
  presencePenalty?: number;
  /** 仅 qwen 支持（enable_thinking），其他 provider 自动过滤 */
  enableThinking?: boolean;
  /**
   * 联网检索：开启后 provider 支持时注入 enable_search（百炼 qwen 系列，
   * 含 qwen-flash，实测支持）；不支持联网的 provider 会自动忽略该标志
   */
  webSearch?: boolean;
  /** 中断信号：用户点「停止」或服务端中止时透传到 fetch，真正中断底层连接 */
  signal?: AbortSignal;
  /**
   * 调用超时（毫秒）：超过该时长仍无任何响应/首字，则主动 abort 并抛出
   * 「模型响应超时」语义的 Error，避免流永久挂起（弱网/审核静默拦截场景）。
   */
  timeoutMs?: number;
}

export type ProviderId = "qwen" | "deepseek" | "glm" | "openai-compatible";

export interface ProviderCapabilities {
  topP?: boolean;
  frequencyPenalty?: boolean;
  presencePenalty?: boolean;
  enableThinking?: boolean;
  /** 是否支持 enable_search 联网检索（当前仅 qwen） */
  webSearch?: boolean;
}

export interface ProviderPreset {
  id: ProviderId;
  /** 默认 Base URL（环境变量 LLM_BASE_URL / QWEN_BASE_URL 可覆盖） */
  baseUrl: string;
  supports: ProviderCapabilities;
}

/** 运行时解析后的完整配置 */
export interface LlmConfig extends ProviderPreset {
  apiKey: string;
  /** 实际使用的 Base URL（已去尾部斜杠） */
  baseUrl: string;
  /** 实际使用的模型名（必填：LLM_MODEL → QWEN_MODEL；均缺失时抛错，不设代码默认值） */
  model: string;
  /** 强模型名（原创度重写用；缺省回退 model） */
  strongModel: string;
}
