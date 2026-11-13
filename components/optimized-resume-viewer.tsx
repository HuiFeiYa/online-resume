"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Download, Loader2, Pencil, Printer } from "lucide-react";
import ResumeFrame from "@/components/resume-frame";
import ResumePreview from "@/components/resume-preview";
import type { OptimizationChange } from "@/lib/analysis/optimize";
import type { ResumeData, TemplateTheme } from "@/lib/resume/schema";

export default function OptimizedResumeViewer({
  id,
  title,
  data,
  changes,
  theme,
  rendererKey,
  templateSlug,
}: {
  id: string;
  title: string;
  data: ResumeData;
  changes: OptimizationChange[];
  theme: TemplateTheme;
  rendererKey: string;
  templateSlug: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"preview" | "changes">("preview");

  async function download(kind: "docx" | "pdf") {
    setBusy(true);
    setMessage("");
    try {
      const resp = await fetch(`/api/optimized-resumes/${id}/export/${kind}?template=${encodeURIComponent(templateSlug)}`, {
        method: "POST",
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error?.message || "导出失败");
      }
      const blob = await resp.blob();
      const header = resp.headers.get("Content-Disposition") || "";
      const match = header.match(/filename\*=UTF-8''([^;]+)/i);
      const fileName = match ? decodeURIComponent(match[1]) : `${title}.${kind}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "导出失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">AI optimized resume</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/editor/optimized/${id}`} className="btn-secondary">
            <Pencil size={15} /> 调整内容
          </Link>
          <button type="button" onClick={() => download("docx")} disabled={busy} className="btn-secondary">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Word
          </button>
          <button type="button" onClick={() => download("pdf")} disabled={busy} className="btn-primary">
            <Printer size={15} /> PDF
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-right text-xs text-accent-danger">{message}</p> : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
        <section className="surface-card overflow-hidden p-4 sm:p-6">
          <div className="mx-auto max-w-[794px]">
            <ResumeFrame>
              <ResumePreview data={data} theme={theme} rendererKey={rendererKey} />
            </ResumeFrame>
          </div>
        </section>

        <aside className="surface-card h-fit p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`rounded px-2.5 py-1.5 text-xs ${tab === "preview" ? "bg-primary-pine text-white" : "bg-surface-base text-ink-muted"}`}
            >
              优化摘要
            </button>
            <button
              type="button"
              onClick={() => setTab("changes")}
              className={`rounded px-2.5 py-1.5 text-xs ${tab === "changes" ? "bg-primary-pine text-white" : "bg-surface-base text-ink-muted"}`}
            >
              逐项对照
            </button>
          </div>
          {tab === "preview" ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-6 text-ink-soft">
                已保留原始事实和时间线，重点优化表达结构、动作动词和成果呈现。导出前请核对所有数字和经历。
              </p>
              <div className="rounded-md bg-surface-base p-3 text-xs leading-5 text-ink-muted">
                共 {changes.length} 处重点改写。切换到逐项对照可查看原文与改写前后差异。
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {changes.map((change, index) => (
                <article key={`${change.section}-${index}`} className="rounded-md border border-surface-line p-3">
                  <p className="text-xs font-medium text-ink">{change.section}</p>
                  <p className="mt-2 rounded bg-accent-danger/5 px-2 py-1.5 text-[11px] leading-5 text-ink-muted">
                    原：{change.before}
                  </p>
                  <p className="mt-1.5 rounded bg-accent-success/5 px-2 py-1.5 text-[11px] leading-5 text-ink-soft">
                    改：{change.after}
                  </p>
                  <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-5 text-ink-muted">
                    <Check size={12} className="mt-0.5 shrink-0 text-accent-success" />
                    {change.reason}
                  </p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}