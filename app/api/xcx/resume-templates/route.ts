import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listServerTemplates } from "@/lib/remote-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  keyword: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  sortBy: z.enum(["sort", "heat", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "参数校验失败" } },
        { status: 400 },
      );
    }
    const sort =
      parsed.data.sortBy === "heat"
        ? "popular"
        : parsed.data.sortBy === "createdAt"
          ? "latest"
          : "recommended";
    const result = await listServerTemplates({
      q: parsed.data.keyword,
      category: parsed.data.category,
      sort,
    });
    return NextResponse.json({
      templates: result.templates,
      page: {
        current: parsed.data.page || 1,
        pageSize: parsed.data.pageSize || 50,
        total: result.total,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("[api/xcx/resume-templates]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "模板服务异常，请稍后重试" } },
      { status: 500 },
    );
  }
}