"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ username, password }),
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
      <div>
        <label className="field-label" htmlFor="username">昵称</label>
        <input
          id="username"
          className="field-input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={isLogin ? "输入你的昵称" : "2 至 20 个字符"}
          minLength={isLogin ? 1 : 2}
          maxLength={20}
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
          placeholder={isLogin ? "输入密码" : "至少 6 位"}
          minLength={isLogin ? 1 : 6}
          maxLength={72}
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