import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * 通用 cookie-session 骨架（不耦合任何具体登录方式）。
 * 使用 HMAC-SHA256 对 payload 签名，存入 httpOnly cookie；
 * 校验时用 timingSafeEqual 防时序攻击。生产务必设置 AUTH_SECRET。
 */

const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 天（秒）
const DEFAULT_SECRET = "dev-only-insecure-secret-change-me";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn(
      "[auth] 未设置 AUTH_SECRET，使用内置不安全默认值；生产环境请通过环境变量配置随机长串。",
    );
    return DEFAULT_SECRET;
  }
  return secret;
}

export interface SessionPayload {
  uid: string;
  exp: number; // 毫秒时间戳
}

/** 生成签名会话令牌：base64url(payload).base64url(hmac) */
export function signSession(userId: string): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Date.now() + MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/** 校验会话令牌：无效 / 过期返回 null */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** 在响应中写入会话 cookie（调用后应在 Route Handler 内设置） */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = signSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** 清除会话 cookie */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** 从当前请求上下文读取并校验登录用户 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
