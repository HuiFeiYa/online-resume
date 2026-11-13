import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSetting, setSetting } from "@/lib/settings";

export const FREE_DAILY_ANALYSIS_QUOTA = 1;
export const FREE_DAILY_OPTIMIZE_QUOTA = 1;

export function freeDailyQuota(_action: QuotaStatus["action"]) {
  return FREE_DAILY_ANALYSIS_QUOTA;
}
const DAY_MS = 24 * 60 * 60 * 1000;
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 免费额度按北京时间自然日计算，00:00 重置。 */
export function beijingDayWindow(now = Date.now()) {
  const shifted = now + BEIJING_OFFSET_MS;
  const start = Math.floor(shifted / DAY_MS) * DAY_MS - BEIJING_OFFSET_MS;
  return {
    start,
    end: start + DAY_MS,
    key: `day:${new Date(start).toISOString().slice(0, 10)}`,
  };
}

export function isVipActive(
  user: { isVip?: number | null; vipExpiresAt?: number | null },
  now = Date.now(),
) {
  if (user.isVip !== 1) return false;
  return !user.vipExpiresAt || user.vipExpiresAt > now;
}

export type QuotaStatus = {
  action: "resume_analysis" | "resume_optimize";
  freeLimit: number;
  used: number;
  remaining: number;
  vip: boolean;
  resetAt: number;
};

export async function getQuotaStatus(
  userId: string,
  action: QuotaStatus["action"],
): Promise<QuotaStatus> {
  const db = await getDb();
  const [user] = await db
    .select({
      isVip: schema.users.isVip,
      vipExpiresAt: schema.users.vipExpiresAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  const vip = isVipActive(user || {});
  const freeLimit = freeDailyQuota(action);
  if (vip) {
    return {
      action,
      freeLimit,
      used: 0,
      remaining: freeLimit,
      vip: true,
      resetAt: beijingDayWindow().end,
    };
  }

  const window = beijingDayWindow();
  const rows = await db
    .select()
    .from(schema.usageCounters)
    .where(
      and(
        eq(schema.usageCounters.subjectHash, userId),
        eq(schema.usageCounters.action, action),
        gte(schema.usageCounters.windowStart, window.start),
        lte(schema.usageCounters.windowStart, window.end),
      ),
    )
    .limit(1);
  const used = rows[0]?.count ?? 0;
  return {
    action,
    freeLimit,
    used,
    remaining: Math.max(0, freeLimit - used),
    vip: false,
    resetAt: window.end,
  };
}

export type QuotaConsumeResult =
  | { ok: true; quota: QuotaStatus; reservationId: string | null }
  | { ok: false; quota: QuotaStatus; reason: "QUOTA_EXCEEDED" };

/**
 * 模型调用前占用一次额度。成员使用会员身份时不写计数器，返回 null 占位。
 * 失败场景必须调用 releaseQuota，避免用户因服务异常损失免费次数。
 */
export async function consumeQuota(
  userId: string,
  action: QuotaStatus["action"],
): Promise<QuotaConsumeResult> {
  const status = await getQuotaStatus(userId, action);
  if (status.vip) {
    return { ok: true, quota: status, reservationId: null };
  }
  if (status.remaining <= 0) {
    return { ok: false, quota: status, reason: "QUOTA_EXCEEDED" };
  }

  const db = await getDb();
  const window = beijingDayWindow();
  const id = `u-${userId}-${action}-${window.start}`;
  await db
    .insert(schema.usageCounters)
    .values({
      id,
      subjectHash: userId,
      action,
      windowStart: window.start,
      count: 1,
    })
    .onConflictDoUpdate({
      target: schema.usageCounters.id,
      set: { count: sql`${schema.usageCounters.count} + 1` },
    });

  const quota = await getQuotaStatus(userId, action);
  return { ok: true, quota, reservationId: id };
}

export async function releaseQuota(
  userId: string,
  action: QuotaStatus["action"],
): Promise<void> {
  const db = await getDb();
  const window = beijingDayWindow();
  const id = `u-${userId}-${action}-${window.start}`;
  const rows = await db
    .select()
    .from(schema.usageCounters)
    .where(eq(schema.usageCounters.id, id))
    .limit(1);
  const current = rows[0];
  if (!current || current.count <= 0) return;
  await db
    .update(schema.usageCounters)
    .set({ count: current.count - 1 })
    .where(eq(schema.usageCounters.id, id));
}

export type MembershipPricing = {
  priceYuan: number;
  originalPriceYuan: number | null;
  periodLabel: string;
  benefits: string[];
  contactWechat: string;
  contactQrUrl: string;
};

const PRICING_KEY = "membership.pricing.v1";
const DEFAULT_PRICING: MembershipPricing = {
  priceYuan: 9.9,
  originalPriceYuan: 19.9,
  periodLabel: "每月",
  benefits: ["每日简历诊断不限次", "一键 AI 优化简历", "优化版简历 DOCX / PDF 导出"],
  contactWechat: "w_huifei2333_x",
  contactQrUrl: "",
};

export async function getMembershipPricing(): Promise<MembershipPricing> {
  const local = await getLocalMembershipPricing();
  const remote = await fetchRemoteMembershipPricing();
  return remote || local;
}

async function fetchRemoteMembershipPricing(): Promise<MembershipPricing | null> {
  const base = (process.env.RESUME_MEMBERSHIP_API_BASE || "").replace(/\/+$/, "");
  if (!base) return null;
  try {
    const resp = await fetch(`${base}/api/public/resume-membership`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!resp.ok) return null;
    const body = await resp.json() as { settings?: Partial<MembershipPricing> };
    if (!body.settings) return null;
    return normalizePricing(body.settings);
  } catch {
    return null;
  }
}

async function getLocalMembershipPricing(): Promise<MembershipPricing> {
  const raw = await getSetting(PRICING_KEY, "");
  if (!raw) return DEFAULT_PRICING;
  try {
    return normalizePricing(JSON.parse(raw) as Partial<MembershipPricing>);
  } catch {
    return DEFAULT_PRICING;
  }
}

function normalizePricing(parsed: Partial<MembershipPricing>): MembershipPricing {
  return {
    ...DEFAULT_PRICING,
    ...parsed,
    priceYuan: Number(parsed.priceYuan ?? DEFAULT_PRICING.priceYuan),
    originalPriceYuan:
      parsed.originalPriceYuan === null
        ? null
        : Number(parsed.originalPriceYuan ?? DEFAULT_PRICING.originalPriceYuan),
    benefits: Array.isArray(parsed.benefits) && parsed.benefits.length
      ? parsed.benefits.map(String)
      : DEFAULT_PRICING.benefits,
    periodLabel: String(parsed.periodLabel || DEFAULT_PRICING.periodLabel),
    contactWechat: String(parsed.contactWechat || DEFAULT_PRICING.contactWechat),
    contactQrUrl: String(parsed.contactQrUrl || ""),
  };
}

export async function setMembershipPricing(value: MembershipPricing): Promise<void> {
  await setSetting(PRICING_KEY, JSON.stringify(value));
}

export async function setUserVip(
  userId: string,
  isVip: boolean,
  vipExpiresAt: number | null,
): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.users)
    .set({
      isVip: isVip ? 1 : 0,
      vipExpiresAt: isVip ? vipExpiresAt : null,
    })
    .where(eq(schema.users.id, userId));
}