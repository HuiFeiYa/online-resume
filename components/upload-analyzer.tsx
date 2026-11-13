"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  Target,
  UploadCloud,
} from "lucide-react";
import MembershipDialog, { type MembershipPricing } from "@/components/membership-dialog";

type Stage = {
  key: string;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done" | "error";
};

const initialStages: Stage[] = [
  { key: "parsing", label: "解析简历文件", status: "pending" },
  { key: "analyzing", label: "大模型深度分析", status: "pending" },
  { key: "validating", label: "校验 V2 评分规则", status: "pending" },
  { key: "saving", label: "保存诊断报告", status: "pending" },
];

export default function UploadAnalyzer({
  remaining = 2,
  vip = false,
  pricing,
}: {
  remaining?: number;
  vip?: boolean;
  pricing?: MembershipPricing;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMembership, setShowMembership] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [chars, setChars] = useState(0);
  const [reportId, setReportId] = useState("");

  function resetProgress() {
    setStages(initialStages.map((stage) => ({ ...stage })));
    setChars(0);
    setReportId("");
  }

  function markStage(key: string, status: Stage["status"], detail?: string) {
    setStages((current) =>
      current.map((stage) =>
        stage.key === key ? { ...stage, status, detail: detail ?? stage.detail } : stage,
      ),
    );
  }

  function failStage(message: string) {
    setStages((current) => {
      const activeIndex = current.findIndex((stage) => stage.status === "active");
      return current.map((stage, index) =>
        index === activeIndex || (activeIndex === -1 && index === current.length - 1)
          ? { ...stage, status: "error", detail: message }
          : stage,
      );
    });
  }

  async function analyze() {
    if (!file) {
      setError("请选择简历文件");
      return;
    }
    if (!vip && remaining <= 0) {
      setShowMembership(true);
      return;
    }
    if (jd.trim().length > 0 && jd.trim().length < 30) {
      setError("目标 JD 至少需要 30 个字符，留空则不做岗位匹配");
      return;
    }

    setBusy(true);
    setError("");
    resetProgress();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const form = new FormData();
      form.append("file", file);
      if (jd.trim()) form.append("jd", jd.trim());

      const resp = await fetch("/api/analyses", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (resp.status === 401) {
        router.push("/login?next=/analysis");
        return;
      }
      if (resp.status === 402) {
        setShowMembership(true);
        return;
      }
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error?.message || "分析请求失败");
      }
      if (!resp.body) throw new Error("服务器没有返回分析进度流");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const dataLine = block
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(dataLine.slice(6));
          } catch {
            continue;
          }
          handleEvent(event);
        }
      }

      if (buffer.includes("data: ")) {
        const line = buffer.split("\n").find((item) => item.startsWith("data: "));
        if (line) {
          try {
            handleEvent(JSON.parse(line.slice(6)));
          } catch {
            // 忽略被截断的尾部事件，服务端正常结束时会补发完整事件。
          }
        }
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setError("已取消分析");
      } else {
        const message = err instanceof Error ? err.message : "网络异常，请重试";
        setError(message);
        failStage(message);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  function handleEvent(event: Record<string, unknown>) {
    const type = event.type;
    if (type === "stage" && typeof event.stage === "string") {
      const key = event.stage;
      const label = typeof event.label === "string" ? event.label : "正在分析";
      const detail = typeof event.detail === "string" ? event.detail : undefined;
      if (key === "analyzing") {
        markStage("parsing", "done");
        markStage("analyzing", "active", label);
      } else {
        const order = initialStages.findIndex((stage) => stage.key === key);
        setStages((current) =>
          current.map((stage, index) => {
            if (index < order) return stage.status === "pending" ? { ...stage, status: "done" } : stage;
            if (index === order) return { ...stage, status: "active", detail };
            return stage;
          }),
        );
      }
      return;
    }
    if (type === "progress") {
      const value = typeof event.chars === "number" ? event.chars : 0;
      setChars(value);
      markStage("analyzing", "active", `模型已生成 ${value.toLocaleString("zh-CN")} 个字符`);
      return;
    }
    if (type === "retry") {
      const message = typeof event.message === "string" ? event.message : "正在自动重试";
      setChars(0);
      markStage("analyzing", "active", message);
      return;
    }
    if (type === "error") {
      const message = typeof event.message === "string" ? event.message : "分析失败";
      setError(message);
      failStage(message);
      return;
    }
    if (type === "done" && typeof event.id === "string") {
      setStages((current) =>
        current.map((stage) => ({
          ...stage,
          status: stage.key === "analyzing" ? "done" : stage.status === "error" ? "error" : "done",
        })),
      );
      setReportId(event.id);
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  const hasError = Boolean(error);
  const completed = Boolean(reportId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md bg-surface-base px-3 py-2 text-xs">
        <span className="text-ink-muted">今日免费评分</span>
        <span className={!vip && remaining <= 0 ? "text-accent-danger" : "text-ink"}>
          {vip ? "会员 · 不限次" : `剩余 ${remaining} / 1 次`}
        </span>
      </div>
      <div>
        <label className="field-label" htmlFor="resume-file">简历文件</label>
        <div
          id="resume-file"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files[0];
            if (dropped) {
              setFile(dropped);
              setError("");
            }
          }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-primary-teal bg-primary-pine/5" : "border-surface-line bg-white/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.pdf"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setError("");
            }}
          />
          <UploadCloud size={30} strokeWidth={1.5} className="mx-auto text-primary-pine" />
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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-secondary mt-4 mx-auto"
            disabled={busy}
          >
            选择文件
          </button>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="jd-input">
          目标岗位 JD <span className="font-normal text-ink-muted">（可选，填写后才会计算岗位匹配度）</span>
        </label>
        <textarea
          id="jd-input"
          className="field-textarea min-h-28"
          value={jd}
          onChange={(event) => setJd(event.target.value)}
          placeholder="粘贴目标岗位的职责和任职要求。留空时岗位匹配度按未提供 JD 保守判断。"
          disabled={busy}
          maxLength={20000}
        />
        <p className="mt-1.5 text-right text-xs text-ink-muted">{jd.length} / 20000 字符</p>
      </div>

      {busy || completed || hasError ? (
        <section className="rounded-lg border border-surface-line bg-white p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">
              {completed ? "分析完成" : hasError ? "分析中断" : "AI 正在分析"}
            </p>
            {busy ? (
              <button type="button" onClick={cancel} className="text-xs text-ink-muted hover:text-ink">
                取消
              </button>
            ) : null}
          </div>
          <ol className="mt-3 space-y-2.5">
            {stages.map((stage) => (
              <li key={stage.key} className="flex items-start gap-2.5">
                <span className="mt-0.5">
                  {stage.status === "done" ? (
                    <CheckCircle2 size={15} className="text-accent-success" />
                  ) : stage.status === "error" ? (
                    <ShieldAlert size={15} className="text-accent-danger" />
                  ) : stage.status === "active" ? (
                    <Loader2 size={15} className="animate-spin text-primary-pine" />
                  ) : (
                    <span className="block h-[15px] w-[15px] rounded-full border border-surface-line" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs leading-5 ${
                    stage.status === "pending" ? "text-ink-muted" : "text-ink"
                  }`}>
                    {stage.label}
                  </p>
                  {stage.detail ? (
                    <p className="break-words text-[11px] leading-4 text-ink-muted">{stage.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          {busy && stages.some((stage) => stage.key === "analyzing" && stage.status === "active") ? (
            <p className="mt-3 rounded bg-surface-base px-3 py-2 text-[11px] leading-5 text-ink-muted">
              已接收 {chars.toLocaleString("zh-CN")} 个模型输出字符。完成后会按四个维度核算总分。
            </p>
          ) : null}
          {completed ? (
            <a href={`/analysis/${reportId}`} className="btn-primary mt-4 w-full">
              查看完整诊断报告
            </a>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <p className="rounded-md border border-accent-danger/20 bg-accent-danger/5 px-3 py-2 text-sm leading-6 text-accent-danger">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={analyze}
        disabled={busy}
        className="btn-primary w-full"
      >
        {busy ? (
          <><Loader2 size={16} className="animate-spin" /> 正在进行 V2 深度分析</>
        ) : (
          <><Target size={16} /> 开始 AI 深度分析</>
        )}
      </button>
      <p className="text-center text-xs leading-5 text-ink-muted">
        本功能只接受大模型结果，不使用本地规则兜底。模型未配置、调用失败或输出不符合评分规则时会直接提示错误。
      </p>
      <MembershipDialog
        open={showMembership}
        onClose={() => setShowMembership(false)}
        pricing={pricing}
        reason="今天的一次免费评分已用完，开通会员后可继续不限次数诊断。"
      />
    </div>
  );
}