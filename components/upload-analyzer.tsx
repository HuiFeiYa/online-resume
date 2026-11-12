"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, UploadCloud } from "lucide-react";

export default function UploadAnalyzer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function analyze() {
    if (!file) {
      setError("请选择简历文件");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/analyses", { method: "POST", body: form });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        router.push("/login?next=/analysis");
        return;
      }
      if (!resp.ok) {
        setError(body?.error?.message || "分析失败，请重试");
        return;
      }
      router.push(`/analysis/${body.id}`);
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) setFile(dropped);
        }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary-teal bg-primary-pine/5" : "border-surface-line bg-white/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <UploadCloud size={32} strokeWidth={1.5} className="mx-auto text-primary-pine" />
        {file ? (
          <div className="mt-3">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
              <FileText size={16} /> {file.name}
            </p>
            <p className="mt-1 text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-ink">拖入简历文件，或点击选择</p>
            <p className="mt-1 text-xs text-ink-muted">支持 DOCX 和可复制文本的 PDF，最大 10 MB</p>
          </>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary mt-4 mx-auto">
          选择文件
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-accent-danger">{error}</p> : null}
      <button type="button" onClick={analyze} disabled={busy} className="btn-primary mt-5 w-full">
        {busy ? <><Loader2 size={16} className="animate-spin" /> 正在分析，通常需要 10 至 30 秒</> : "开始免费分析"}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
        文件仅用于生成本次分析报告，不会出现在公开模板中。配置模型时会将文本发送给模型服务；未配置时使用本地规则分析。
      </p>
    </div>
  );
}