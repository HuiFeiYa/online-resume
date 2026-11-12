"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GUEST_DRAFT_KEY, type GuestDraft } from "@/components/new-resume-buttons";
import { createDemoResume, resumeDataSchema } from "@/lib/resume/schema";

export default function StartGuestDraft({
  templateSlug,
}: {
  templateSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      sessionStorage.setItem("jianye_editor_referrer", `/templates/${templateSlug}`);
    } catch {
      // The editor has its own fallback when session storage is unavailable.
    }
    try {
      const existingRaw = localStorage.getItem(GUEST_DRAFT_KEY);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw) as GuestDraft;
        const parsed = resumeDataSchema.safeParse(existing?.data);
        if (parsed.success) {
          router.replace("/editor/draft");
          return;
        }
      }
      const data = createDemoResume();
      const draft: GuestDraft = {
        title: "示例简历",
        templateSlug,
        data,
        updatedAt: Date.now(),
      };
      localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
      router.replace("/editor/draft");
    } catch {
      setError("浏览器本地存储不可用，请关闭无痕模式后重试");
    }
  }, [router, templateSlug]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {error ? (
        <>
          <p className="text-sm text-accent-danger">{error}</p>
          <button type="button" onClick={() => router.push("/templates")} className="btn-secondary mt-4">
            返回模板中心
          </button>
        </>
      ) : (
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin" /> 正在创建本地草稿
        </span>
      )}
    </main>
  );
}