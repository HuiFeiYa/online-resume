import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleAlert, Lightbulb } from "lucide-react";
import { getSessionUser } from "@/lib/auth/current-user";
import { getAnalysisForUser } from "@/lib/analysis/store";
import type { ResumeAnalysisReport } from "@/lib/analysis/v2";

export const metadata = { title: "简历诊断报告" };

const dimensionTone: Record<string, string> = {
  information_completeness: "bg-primary-teal",
  job_match: "bg-primary-teal",
  experience_quality: "bg-primary-gold",
  career_trajectory: "bg-primary-pine",
};

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
  const report = analysis.result as ResumeAnalysisReport;
  const isV2 = report.version === "2.0";
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
          <p className={`mt-4 font-display text-7xl font-bold ${scoreTone}`}>
            {report.overallScore}
          </p>
          <p className="mt-1 text-sm text-ink-muted">总分 / 100</p>
          <p className="mt-4 text-sm leading-6 text-ink-soft">{report.summary}</p>
          <div className="mt-5 space-y-2">
            <Link href="/dashboard" className="btn-secondary w-full">返回工作台</Link>
            <Link href="/match" className="btn-ghost w-full">继续做 JD 匹配</Link>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Dimensions</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-ink">维度得分</h1>
                <p className="mt-1 text-xs text-ink-muted">
                  {isV2 ? "V2 规则 · 经历质量占 45 分" : "历史报告 · 旧版六维规则"}
                </p>
              </div>
              <span className="max-w-[55%] truncate text-xs text-ink-muted">{analysis.fileName}</span>
            </div>
            <div className="mt-5 space-y-5">
              {report.dimensions.map((item) => {
                const percent = Math.round((item.score / item.max) * 100);
                return (
                  <article key={item.key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{item.label}</span>
                        {item.key === "experience_quality" ? (
                          <span className="rounded bg-primary-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-gold">
                            核心
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-ink-muted">{item.score} / {item.max}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-base">
                      <div
                        className={`h-full rounded-full ${dimensionTone[item.key] || "bg-primary-teal"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-ink-muted">{item.summary}</p>
                    {item.details?.length ? (
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        {item.details?.map((detail) => (
                          <div key={detail.key} className="flex items-baseline justify-between rounded bg-surface-base px-2.5 py-1.5">
                            <span className="text-[11px] text-ink-soft">{detail.label}</span>
                            <span className="text-[11px] font-medium text-ink">{detail.score} / {detail.max}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <p className="eyebrow">Issues</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">需要优先修改的问题</h2>
            <div className="mt-5 space-y-3">
              {report.issues.map((issue, index) => (
                <article key={`${issue.dimension || "legacy"}-${issue.section}-${index}`} className="rounded-md border border-surface-line bg-white p-4">
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
                    <span className="text-[11px] text-ink-muted">· {issue.dimension ? dimensionName(issue.dimension) : "历史六维报告"}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink">{issue.issue}</p>
                  <p className="mt-2 rounded bg-surface-base px-3 py-2 text-xs leading-5 text-ink-soft">
                    原文依据：{issue.evidence}
                  </p>
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
            <ol className="mt-4 space-y-2.5">
              {report.quickWins.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2.5 text-sm leading-6 text-ink-soft">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-pine/10 text-[10px] font-semibold text-primary-pine">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </section>

          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <CircleAlert size={13} /> 本报告由大模型按 V2 规则生成，请结合实际经历核对后再修改简历。
          </p>
        </div>
      </div>
    </main>
  );
}

function dimensionName(key: string) {
  return {
    information_completeness: "信息完整度",
    job_match: "岗位匹配度",
    experience_quality: "经历质量",
    career_trajectory: "职业轨迹",
  }[key] || key;
}