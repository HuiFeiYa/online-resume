"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDemoResume } from "@/lib/resume/schema";

export const GUEST_DRAFT_KEY = "jianye_guest_resume_v1";

export type GuestDraft = {
  title: string;
  templateSlug: string;
  data: ReturnType<typeof createDemoResume>;
  updatedAt: number;
};

export default function NewResumeButtons({
  templateSlug,
}: {
  templateSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  function create() {
    setError("");
    try {
      sessionStorage.setItem("jianye_editor_referrer", "/editor/new");
    } catch {
      // The editor has its own fallback when session storage is unavailable.
    }
    try {
      const draft: GuestDraft = {
        title: "示例简历",
        templateSlug,
        data: createDemoResume(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
      router.push("/editor/draft");
    } catch {
      setError("浏览器本地存储不可用，请关闭无痕模式后重试");
    }
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={create} className="btn-primary h-9 w-full px-3 text-xs">
        使用此模板
      </button>
      {error ? <p className="mt-2 text-xs text-accent-danger">{error}</p> : null}
    </div>
  );
}