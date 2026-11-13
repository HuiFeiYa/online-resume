import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/current-user";
import { errorResponse, jsonError } from "@/lib/auth/guard";
import { getMembershipPricing } from "@/lib/quota";

export async function GET() {
  try {
    const pricing = await getMembershipPricing();
    return NextResponse.json({ pricing });
  } catch (err) {
    return jsonError(err, "加载会员价格失败");
  }
}