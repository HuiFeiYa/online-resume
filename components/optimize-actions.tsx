"use client";

import { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import MembershipDialog, { type MembershipPricing } from "@/components/membership-dialog";

export default function OptimizeActions({
  analysisId,
  optimizedId,
  remaining,
  vip,
  pricing,
}: {
  analysisId: string;
  optimizedId?: string | null;
  remaining: number;
  vip: boolean;
  pricing: MembershipPricing;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showMembership, setShowMembership] = useState(false);
  const [createdId, setCreatedId] = useState(optimizedId || "");

  async function optimize() {
    if (!vip && remaining <= 0) {
      setShowMembership(true);
      return;
    }
    setBusy(true);
    setError("");
    setStatus("正在读取诊断建议");
    try {
      const resp = await fetch(`/api/analyses/${analysisId}/optimize`, { method: "POST" });
      if (resp.status === 402) {
        setShowMembership(true);
        return;
      }
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error?.message || "优化失败");
      }
      if (!resp.body) throw new Error("服务器没有返回优化进度");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneId = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const line = block.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "stage" && typeof event.label === "string") setStatus(event.label);
          if (event.type === "progress") {
            setStatus(`正在重写简历，已生成 ${Number(event.chars || 0).toLocaleString("zh-CN")} 个字符`);
          }
          if (event.type === "error") throw new Error(event.message || "优化失败");
          if (event.type === "done" && typeof event.id === "string") doneId = event.id;
        }
      }
      if (!doneId) throw new Error("优化结果未生成");
      setCreatedId(doneId);
      setStatus("优化完成");
      router.push(`/optimized/${doneId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "优化失败，请重试");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-b border-surface-line/80 bg-surface-base/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <a href="#dimensions" className="btn-ghost text-sm">评分明细</a>
          <a href="#issues" className="btn-ghost text-sm">待修改问题</a>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!vip ? (
              <span className={`text-xs ${remaining > 0 ? "text-ink-muted" : "text-accent-danger"}`}>
                今日优化剩余 {remaining} 次
              </span>
            ) : (
              <span className="text-xs text-primary-gold">会员不限次</span>
            )}
            {createdId ? (
              <a href={`/optimized/${createdId}`} className="btn-primary">
                <Download size={15} /> 查看优化版
              </a>
            ) : null}
            <button type="button" onClick={optimize} disabled={busy} className="btn-primary">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {busy ? status || "正在优化" : "一键优化"}
            </button>
          </div>
        </div>
        {error ? <p className="mx-auto mt-2 max-w-5xl text-xs text-accent-danger">{error}</p> : null}
      </div>
      <MembershipDialog
        open={showMembership}
        onClose={() => setShowMembership(false)}
        pricing={pricing}
        reason="今天的免费优化次数已用完，开通会员后可继续不限次数优化。"
      />
    </>
  );
}