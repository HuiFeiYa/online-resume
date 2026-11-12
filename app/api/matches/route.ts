import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getDb, schema } from "@/db";
import { getUserResume } from "@/lib/resume/store";
import { matchJdSmart } from "@/lib/analysis/ai";
import { createId, type ResumeData } from "@/lib/resume/schema";
import { z } from "zod";

const bodySchema = z.object({
  resumeId: z.string().min(1),
  jd: z.string().trim().min(30, "JD 内容太短").max(20000),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "输入有误");
    }
    const resume = await getUserResume(user.id, parsed.data.resumeId);
    if (!resume) return errorResponse("NOT_FOUND", "简历不存在", 404);
    const text = resumeToText(resume.data);
    const result = await matchJdSmart(text, parsed.data.jd);
    const db = await getDb();
    const id = createId("m");
    const now = Date.now();
    await db.insert(schema.analysisJobs).values({
      id,
      userId: user.id,
      kind: "jd",
      status: "completed",
      fileName: resume.title,
      fileKey: null,
      extractedText: text.slice(0, 30000),
      jdText: parsed.data.jd,
      resultJson: JSON.stringify(result),
      score: result.score,
      model: process.env.LLM_MODEL || "local-heuristic",
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    return NextResponse.json({ id, kind: "jd", report: result });
  } catch (err) {
    return jsonError(err, "JD 匹配失败");
  }
}

function resumeToText(data: ResumeData) {
  const lines = [
    data.basics.name,
    data.basics.jobTitle,
    data.basics.summary,
    data.intention.targetRole,
    ...data.experience.flatMap((item) => [item.company, item.role, ...item.bullets]),
    ...data.projects.flatMap((item) => [item.name, item.role || "", item.tech.join(" "), ...item.bullets]),
    ...data.education.flatMap((item) => [item.school, item.major, item.degree, ...item.highlights]),
    ...data.skills.flatMap((item) => [item.category, item.items.join(" ")]),
    ...data.certificates,
    ...data.languages,
  ];
  return lines.filter(Boolean).join("\n");
}