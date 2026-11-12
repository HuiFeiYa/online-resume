"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import ResumeEditor from "@/components/resume-editor";
import { GUEST_DRAFT_KEY, type GuestDraft } from "@/components/new-resume-buttons";
import {
  createEmptyResume,
  defaultTheme,
  resumeDataSchema,
  type ResumeData,
  type TemplateTheme,
} from "@/lib/resume/schema";

type LoadedDraft = {
  title: string;
  templateSlug: string;
  data: ResumeData;
  theme: TemplateTheme;
  rendererKey: string;
};

export default function GuestDraftEditor({
  loggedIn,
  autoExport = null,
}: {
  loggedIn: boolean;
  autoExport?: "docx" | "pdf" | null;
}) {
  const [draft, setDraft] = useState<LoadedDraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = localStorage.getItem(GUEST_DRAFT_KEY);
        if (!raw) {
          if (!cancelled) setLoading(false);
          return;
        }
        const parsed = JSON.parse(raw) as GuestDraft;
        const data = resumeDataSchema.safeParse(parsed.data);
        if (!data.success) {
          if (!cancelled) setLoading(false);
          return;
        }
        let theme = defaultTheme;
        let rendererKey = "classic";
        try {
          const resp = await fetch(`/api/templates/${encodeURIComponent(parsed.templateSlug)}`);
          if (resp.ok) {
            const body = await resp.json();
            theme = body.template?.theme || defaultTheme;
            rendererKey = body.template?.rendererKey || "classic";
          }
        } catch {
          // A default theme still lets the guest finish and export the draft.
        }
        if (!cancelled) {
          setDraft({
            title: parsed.title || "我的简历",
            templateSlug: parsed.templateSlug || "forest-editorial",
            data: data.data,
            theme,
            rendererKey,
          });
        }
      } catch {
        // Corrupt local drafts are treated as absent rather than breaking the page.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin" /> 正在读取本地草稿
        </span>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="mx-auto flex max-w-lg flex-col px-4 py-20">
        <div className="surface-card p-8 text-center">
          <FileText size={28} className="mx-auto text-primary-pine/70" />
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">没有找到本地草稿</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            可能是更换了浏览器、清理了浏览数据，或还没有创建简历。
          </p>
          <Link href="/templates" className="btn-primary mt-5">选择一个模板</Link>
        </div>
      </main>
    );
  }

  return (
    <ResumeEditor
      initialTitle={draft.title}
      initialData={draft.data}
      theme={draft.theme}
      templateSlug={draft.templateSlug}
      loggedIn={loggedIn}
      autoExport={autoExport}
      rendererKey={draft.rendererKey}
    />
  );
}