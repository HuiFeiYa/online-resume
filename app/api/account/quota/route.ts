import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getMembershipPricing, getQuotaStatus } from "@/lib/quota";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("UNAUTHORIZED", "请先登录", 401);
    const [analysis, optimize, pricing] = await Promise.all([
      getQuotaStatus(user.id, "resume_analysis"),
      getQuotaStatus(user.id, "resume_optimize"),
      getMembershipPricing(),
    ]);
    return NextResponse.json({
      vip: user.isVip,
      vipExpiresAt: user.vipExpiresAt,
      analysis,
      optimize,
      pricing,
    });
  } catch (err) {
    return jsonError(err, "加载额度失败");
  }
}