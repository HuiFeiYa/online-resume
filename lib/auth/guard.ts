import { NextRequest, NextResponse } from "next/server";
import { verifySession, type SessionPayload } from "./session";

export type GuardResult = AuthedContext | NextResponse;

export interface AuthedContext {
  userId: string;
  session: SessionPayload;
}

export function requireUser(req: NextRequest): GuardResult {
  const token = req.cookies.get("session")?.value;
  const session = verifySession(token);
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 },
    );
  }
  return { userId: session.uid, session };
}

export function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonError(err: unknown, fallback = "请求处理失败") {
  console.error("[api]", err);
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return errorResponse("UNAUTHORIZED", "请先登录", 401);
    }
    if (err.message === "FORBIDDEN") {
      return errorResponse("FORBIDDEN", "没有权限", 403);
    }
  }
  return errorResponse("INTERNAL_ERROR", fallback, 500);
}