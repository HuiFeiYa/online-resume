"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, QrCode, X } from "lucide-react";

export type MembershipPricing = {
  priceYuan: number;
  originalPriceYuan: number | null;
  periodLabel: string;
  benefits: string[];
  contactWechat: string;
  contactQrUrl: string;
};

export const fallbackPricing: MembershipPricing = {
  priceYuan: 9.9,
  originalPriceYuan: 19.9,
  periodLabel: "每月",
  benefits: ["每日简历诊断不限次", "一键 AI 优化简历", "优化版简历 DOCX / PDF 导出"],
  contactWechat: "w_huifei2333_x",
  contactQrUrl: "",
};

export default function MembershipDialog({
  open,
  onClose,
  pricing,
  reason = "今日免费次数已用完",
}: {
  open: boolean;
  onClose: () => void;
  pricing?: MembershipPricing;
  reason?: string;
}) {
  const value = pricing || fallbackPricing;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  async function copyWechat() {
    try {
      await navigator.clipboard.writeText(value.contactWechat);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-surface-line bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Membership</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">开通简历会员</h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">{reason}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-surface-base hover:text-ink"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <span className="font-display text-4xl font-bold text-primary-pine">¥{value.priceYuan}</span>
          <span className="pb-1 text-sm text-ink-muted">/{value.periodLabel}</span>
          {value.originalPriceYuan ? (
            <span className="pb-1 text-xs text-ink-muted line-through">¥{value.originalPriceYuan}</span>
          ) : null}
        </div>

        <ul className="mt-4 space-y-2">
          {value.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm leading-6 text-ink-soft">
              <CheckCircle2 size={15} className="mt-1 shrink-0 text-accent-success" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-md border border-surface-line bg-surface-base/60 p-4">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-surface-line bg-white">
              {value.contactQrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value.contactQrUrl} alt="微信开通二维码" className="h-full w-full object-cover" />
              ) : (
                <QrCode size={32} className="text-primary-pine/60" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">扫码加微信开通</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                添加时备注「简历会员」，开通后即可继续使用。
              </p>
              <button
                type="button"
                onClick={copyWechat}
                className="mt-2 inline-flex items-center gap-1.5 rounded border border-surface-line bg-white px-2.5 py-1.5 text-xs text-ink-soft hover:border-primary-teal/40"
              >
                {copied ? <CheckCircle2 size={13} className="text-accent-success" /> : <Copy size={13} />}
                {copied ? "微信号已复制" : value.contactWechat}
              </button>
            </div>
          </div>
        </div>

        <button type="button" onClick={onClose} className="btn-secondary mt-5 w-full">
          稍后再说
        </button>
      </div>
    </div>
  );
}

export function QuotaBadge({
  remaining,
  vip,
  label,
}: {
  remaining: number;
  vip: boolean;
  label: string;
}) {
  if (vip) {
    return <span className="tag border-primary-gold/30 bg-primary-gold/10 text-primary-gold">会员 · 不限次</span>;
  }
  return (
    <span className={`tag ${remaining > 0 ? "border-primary-teal/25 text-primary-pine" : "border-accent-danger/25 text-accent-danger"}`}>
      {label}剩余 {remaining} 次
    </span>
  );
}