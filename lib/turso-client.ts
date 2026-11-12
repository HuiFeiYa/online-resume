import { Agent, fetch as undiciFetch } from "undici";

/**
 * Turso 连通性加固：
 * 在部分网络环境（企业代理 / 防火墙）下，到 Turso 的 TCP 握手会偶发被丢弃或变慢，
 * @libsql 默认 10s 连接超时极易触发 UND_ERR_CONNECT_TIMEOUT。
 * 这里用 undici 的 Agent 把连接超时拉长并强制 IPv4，再包裹一层失败重试，
 * 显著提升连通成功率；Vercel 云端网络正常时同样无损。
 *
 * 注意：@libsql 会把请求以全局 Request 对象传入 fetch，而 npm undici 的 fetch 只认
 * 自己的 Request 类，因此这里把传入的 Request 桥接成 URL + method/headers/body。
 */
const dispatcher = new Agent({
  connect: { timeout: 8000, family: 4 },
  headersTimeout: 10000,
  bodyTimeout: 10000,
});

const MAX_ATTEMPTS = 2;

export async function tursoFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let url: string;
  const opts: any = { ...(init || {}) };

  if (typeof input !== "string" && !(input instanceof URL)) {
    const req = input as Request;
    url = req.url;
    if (!opts.method) opts.method = req.method;
    if (!opts.headers) opts.headers = req.headers;
    if (!opts.body && req.bodyUsed === false) {
      const method = (opts.method || req.method || "GET").toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        opts.body = await req.text();
      }
    }
  } else {
    url = input.toString();
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return (await undiciFetch(url, {
        ...opts,
        dispatcher,
      } as any)) as unknown as Response;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastErr;
}
