import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signResumePrintToken(
  userId: string,
  resumeId: string,
  expiresAt: number,
  kind = "resume",
): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, resumeId, expiresAt, kind }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readResumePrintToken(
  token: string,
  resumeId: string,
  kind = "resume",
): string | null {
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  const expected = signature(payload);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: string;
      resumeId?: string;
      expiresAt?: number;
      kind?: string;
    };
    if (
      parsed.resumeId !== resumeId ||
      (parsed.kind || "resume") !== kind ||
      !parsed.userId ||
      !parsed.expiresAt ||
      parsed.expiresAt < Date.now()
    ) {
      return null;
    }
    return parsed.userId;
  } catch {
    return null;
  }
}