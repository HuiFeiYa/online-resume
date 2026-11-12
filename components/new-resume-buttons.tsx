"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewResumeButtons({ templateSlug }: { templateSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(demo: boolean) {
    setBusy(true);
    setError("");
    try {
      const resp = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug, demo }),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/editor/new?template=${templateSlug}`)}`);
        return;
      }
      if (!resp.ok) {
        setError(body?.error?.message || "创建失败");
        return;
      }
      router.push(`/editor/${body.resume.id}`);
      router.refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={() => create(false)} disabled={busy} className="btn-primary h-9 w-full px-3 text-xs">
        {busy ? "创建中..." : "使用此模板"}
      </button>
      <button type="button" onClick={() => create(true)} disabled={busy} className="mt-2 w-full text-center text-[11px] text-primary-pine hover:underline">
        用示例内容创建
      </button>
      {error ? <p className="mt-2 text-xs text-accent-danger">{error}</p> : null}
    </div>
  );
}