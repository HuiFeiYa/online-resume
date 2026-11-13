import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getMembershipPricing, setMembershipPricing, type MembershipPricing } from "@/lib/quota";
import { z } from "zod";

const pricingSchema = z.object({
  priceYuan: z.number().positive().max(9999),
  originalPriceYuan: z.number().positive().max(9999).nullable(),
  periodLabel: z.string().trim().min(1).max(20),
  benefits: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  contactWechat: z.string().trim().min(1).max(80),
  contactQrUrl: z.string().trim().max(500).default(""),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") return errorResponse("FORBIDDEN", "没有权限", 403);
    return NextResponse.json({ pricing: await getMembershipPricing() });
  } catch (err) {
    return jsonError(err, "加载会员配置失败");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") return errorResponse("FORBIDDEN", "没有权限", 403);
    const parsed = pricingSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "配置无效");
    }
    await setMembershipPricing(parsed.data as MembershipPricing);
    return NextResponse.json({ ok: true, pricing: parsed.data });
  } catch (err) {
    return jsonError(err, "保存会员配置失败");
  }
}