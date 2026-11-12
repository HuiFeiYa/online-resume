"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ConsultationForm() {
  const [form, setForm] = useState({
    name: "",
    contactType: "wechat",
    contactValue: "",
    targetRole: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const resp = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(body?.error?.message || "提交失败");
        return;
      }
      setDone(true);
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center text-center">
        <CheckCircle2 size={36} className="text-accent-success" />
        <h3 className="mt-3 text-lg font-semibold text-ink">已收到你的咨询</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-ink-muted">我们会通过你留下的联系方式与你沟通。可以先加入求职交流群获取公开资料。</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="field-label">怎么称呼你</span>
          <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={30} />
        </label>
        <label>
          <span className="field-label">目标岗位</span>
          <input className="field-input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} placeholder="选填" maxLength={60} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
        <label>
          <span className="field-label">联系方式</span>
          <select className="field-input" value={form.contactType} onChange={(e) => setForm({ ...form, contactType: e.target.value })}>
            <option value="wechat">微信</option>
            <option value="phone">手机</option>
            <option value="email">邮箱</option>
          </select>
        </label>
        <label>
          <span className="field-label">账号 / 号码</span>
          <input className="field-input" value={form.contactValue} onChange={(e) => setForm({ ...form, contactValue: e.target.value })} required maxLength={100} />
        </label>
      </div>
      <label>
        <span className="field-label">想咨询什么</span>
        <textarea
          className="field-textarea"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="例如：简历投递没有回复，想确认问题在哪里。"
          maxLength={1000}
        />
      </label>
      {error ? <p className="text-sm text-accent-danger">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "提交中..." : "提交免费咨询"}</button>
      <p className="text-center text-xs text-ink-muted">当前咨询免费，提交仅用于联系和提供求职建议。</p>
    </form>
  );
}