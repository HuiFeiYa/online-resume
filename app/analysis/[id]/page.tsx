import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";
import { getSessionUser } from "@/lib/auth/current-user";
import { getAnalysisForUser } from "@/lib/analysis/store";
import type { ResumeAnalysis } from "@/lib/analysis/local";

export default async function AnalysisReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/analysis/${id}`)}`);
  const analysis = await getAnalysisForUser(user.id, id);
  if (!analysis) notFound();
  const report = analysis.result as ResumeAnalysis;
  const scoreTone =
    report.overallScore >= 80
      ? "text-accent-success"
      : report.overallScore >= 60
        ? "text-accent-warn"
        : "text-accent-danger";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/analysis" className="text-sm text-ink-muted hover:text-ink">← 返回诊断</Link>
      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="surface-card h-fit p-6 text-center">
          <p className="eyebrow">Resume score</p>
          <p className={`mt-4 font-display text-7xl font-bold ${scoreTone}`}>{report.overallScore}</p>
          <p className="mt-1 text-sm text-ink-muted">总分 / 100</p>
          <p className="mt-4 text-sm leading-6 text-ink-soft">{report.summary}</p>
          <Link href="/dashboard" className="btn-secondary mt-5 w-full">返回工作台</Link>
        </aside>

        <div className="space-y-5">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Dimensions</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-ink">维度得分</h1>
              </div>
              <span className="text-xs text-ink-muted">{analysis.fileName}</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {report.dimensions.map((item) => {
                const percent = Math.round((item.score / item.max) * 100);
                return (
                  <div key={item.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-ink-muted">{item.score} / {item.max}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-base">
                      <div className="h-full rounded-full bg-primary-teal" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-muted">{item.summary}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <p className="eyebrow">Issues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">需要优先修改的问题</h2>
            <div className="mt-5 space-y-3">
              {report.issues.map((issue, index) => (
                <article key={`${issue.section}-${index}`} className="rounded-md border border-surface-line bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                      issue.severity === "high"
                        ? "bg-accent-danger/10 text-accent-danger"
                        : issue.severity === "medium"
                          ? "bg-accent-warn/10 text-accent-warn"
                          : "bg-surface-base text-ink-muted"
                    }`}>
                      {issue.severity === "high" ? "高优先级" : issue.severity === "medium" ? "中优先级" : "建议"}
                    </span>
                    <span className="text-xs text-ink-muted">{issue.section}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink">{issue.issue}</p>
                  <p className="mt-2 rounded bg-surface-base px-3 py-2 text-xs leading-5 text-ink-soft">原文依据：{issue.evidence}</p>
                  <p className="mt-3 flex gap-2 text-sm leading-6 text-ink-soft">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary-gold" /> {issue.suggestion}
                  </p>
                  {issue.rewrite ? (
                    <p className="mt-2 border-l-2 border-primary-teal pl-3 text-xs leading-5 text-ink-muted">
                      示例：{issue.rewrite}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <p className="eyebrow">Quick wins</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">可以立刻做的优化</h2>
            <ul className="mt-4 space-y-2.5">
              {report.quickWins.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ink-soft">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-success" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link href="/match" className="btn-primary">继续做 JD 匹配</Link>
            <Link href="/dashboard" className="btn-secondary">回到我的简历</Link>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <CircleAlert size={13} /> 自动分析用于辅助判断，最终内容请结合真实经历核对。
          </p>
        </div>
      </div>
    </main>
  );
}