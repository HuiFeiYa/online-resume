"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const resp = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(body?.error?.message || "操作失败，请重试");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next || "/dashboard");
      router.refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isLogin ? (
        <div>
          <label className="field-label" htmlFor="displayName">昵称</label>
          <input
            id="displayName"
            className="field-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="怎么称呼你"
            maxLength={30}
          />
        </div>
      ) : null}
      <div>
        <label className="field-label" htmlFor="email">邮箱</label>
        <input
          id="email"
          className="field-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="password">密码</label>
        <input
          id="password"
          className="field-input"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isLogin ? "输入密码" : "至少 8 位"}
          minLength={isLogin ? 1 : 8}
          required
        />
      </div>
      {error ? <p className="text-sm text-accent-danger">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "处理中..." : isLogin ? "登录" : "免费注册"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        {isLogin ? "还没有账号？" : "已有账号？"}
        <Link href={isLogin ? "/register" : "/login"} className="ml-1 font-medium text-primary-pine hover:underline">
          {isLogin ? "免费注册" : "去登录"}
        </Link>
      </p>
    </form>
  );
}