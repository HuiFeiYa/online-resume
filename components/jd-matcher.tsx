"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Upload } from "lucide-react";

type ResumeOption = { id: string; title: string; name: string };

export default function JdMatcher({ resumes, loggedIn }: { resumes: ResumeOption[]; loggedIn: boolean }) {
  const router = useRouter();
  const [resumeId, setResumeId] = useState(resumes[0]?.id || "");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!loggedIn) {
      router.push("/login?next=/match");
      return;
    }
    if (!resumeId) {
      setError("请先创建一份简历");
      return;
    }
    if (jd.trim().length < 30) {
      setError("请粘贴完整 JD，至少 30 个字符");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const resp = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jd }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(body?.error?.message || "匹配失败");
        return;
      }
      router.push(`/match/${body.id}`);
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">选择简历</label>
        {resumes.length ? (
          <select className="field-input" value={resumeId} onChange={(event) => setResumeId(event.target.value)}>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title}{resume.name ? ` - ${resume.name}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-md border border-dashed border-surface-line bg-white/60 p-5 text-center">
            <p className="text-sm text-ink-muted">你还没有可分析的在线简历。</p>
            <Link href="/editor/new" className="btn-secondary mt-3">
              <Upload size={14} /> 创建一份简历
            </Link>
          </div>
        )}
      </div>
      <div>
        <label className="field-label">目标岗位 JD</label>
        <textarea
          className="field-textarea min-h-64"
          value={jd}
          onChange={(event) => setJd(event.target.value)}
          placeholder="把招聘网站上的职位描述粘贴到这里，包括岗位职责、任职要求、技能和年限要求。"
        />
        <p className="mt-1.5 text-right text-xs text-ink-muted">{jd.length} 字符</p>
      </div>
      {error ? <p className="text-sm text-accent-danger">{error}</p> : null}
      <button type="button" onClick={submit} disabled={busy} className="btn-primary w-full">
        {busy ? <><Loader2 size={16} className="animate-spin" /> 正在分析匹配度</> : <><Briefcase size={16} /> 开始匹配</>}
      </button>
    </div>
  );
}