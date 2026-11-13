"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Save, UserCog } from "lucide-react";
import type { MembershipPricing } from "@/components/membership-dialog";

export default function AdminPricingForm({ initial }: { initial: MembershipPricing }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const resp = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body?.error?.message || "保存失败");
      setMessage("会员配置已保存，用户端立即生效");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <UserCog size={18} className="text-primary-pine" />
        <h2 className="font-display text-xl font-bold text-ink">会员与价格</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="field-label">月费（元）</span>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="field-input"
            value={form.priceYuan}
            onChange={(event) => setForm({ ...form, priceYuan: Number(event.target.value) })}
          />
        </label>
        <label>
          <span className="field-label">划线原价（元，可留空）</span>
          <input
            type="number"
            step="0.1"
            min="0"
            className="field-input"
            value={form.originalPriceYuan ?? ""}
            onChange={(event) => setForm({
              ...form,
              originalPriceYuan: event.target.value ? Number(event.target.value) : null,
            })}
          />
        </label>
        <label>
          <span className="field-label">计费周期文案</span>
          <input
            className="field-input"
            value={form.periodLabel}
            onChange={(event) => setForm({ ...form, periodLabel: event.target.value })}
            placeholder="每月"
          />
        </label>
        <label>
          <span className="field-label">客服微信号</span>
          <input
            className="field-input"
            value={form.contactWechat}
            onChange={(event) => setForm({ ...form, contactWechat: event.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">微信二维码图片 URL（可留空显示占位图标）</span>
          <input
            className="field-input"
            value={form.contactQrUrl}
            onChange={(event) => setForm({ ...form, contactQrUrl: event.target.value })}
            placeholder="https://..."
          />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">会员权益（每行一条）</span>
          <textarea
            className="field-textarea min-h-24"
            value={form.benefits.join("\n")}
            onChange={(event) => setForm({
              ...form,
              benefits: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
            })}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} 保存配置
        </button>
        {message ? (
          <span className={`text-xs ${message.includes("已保存") ? "text-accent-success" : "text-accent-danger"}`}>
            {message}
          </span>
        ) : null}
      </div>
    </section>
  );
}

export function AdminUserVipActions({
  users,
}: {
  users: Array<{
    id: string;
    username: string;
    isVip: number;
    vipExpiresAt: number | null;
    analysesUsed: number;
    createdAt: number;
  }>;
}) {
  const [rows, setRows] = useState(users);
  const [busy, setBusy] = useState("");

  async function toggle(userId: string, next: boolean) {
    setBusy(userId);
    try {
      const resp = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isVip: next,
          vipExpiresAt: next ? Date.now() + 365 * 24 * 60 * 60 * 1000 : null,
        }),
      });
      if (!resp.ok) throw new Error("更新失败");
      setRows((current) =>
        current.map((row) => row.id === userId ? { ...row, isVip: next ? 1 : 0 } : row),
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-surface-line px-5 py-4">
        <h2 className="font-display text-xl font-bold text-ink">用户与会员</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-surface-base/70 text-xs text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-medium">用户</th>
              <th className="px-5 py-3 font-medium">注册时间</th>
              <th className="px-5 py-3 font-medium">累计评分</th>
              <th className="px-5 py-3 font-medium">会员</th>
              <th className="px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-3 font-medium text-ink">{row.username}</td>
                <td className="px-5 py-3 text-xs text-ink-muted">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="px-5 py-3 text-ink-muted">{row.analysesUsed}</td>
                <td className="px-5 py-3">
                  {row.isVip === 1 ? (
                    <span className="tag border-primary-gold/30 bg-primary-gold/10 text-primary-gold">会员</span>
                  ) : (
                    <span className="tag">普通</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(row.id, row.isVip !== 1)}
                    disabled={busy === row.id}
                    className="text-xs text-primary-pine hover:underline"
                  >
                    {busy === row.id ? "处理中" : row.isVip === 1 ? "取消会员" : "开通会员"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 px-5 py-3 text-[11px] text-ink-muted">
        <CheckCircle2 size={12} /> 手动开通默认一年，后续可接微信支付订单自动续期。
      </p>
    </section>
  );
}