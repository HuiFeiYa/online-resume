import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import { getSessionUser } from "@/lib/auth/current-user";
import { getAnalysisForUser } from "@/lib/analysis/store";

type MatchReport = {
  score: number;
  requirements: Array<{
    requirement: string;
    status: "matched" | "partial" | "missing";
    evidence: string;
    suggestion: string;
  }>;
  missingKeywords: string[];
  summary: string;
};

const statusMeta = {
  matched: { label: "满足", icon: CheckCircle2, tone: "text-accent-success bg-accent-success/10" },
  partial: { label: "部分满足", icon: AlertTriangle, tone: "text-accent-warn bg-accent-warn/10" },
  missing: { label: "未体现", icon: CircleHelp, tone: "text-accent-danger bg-accent-danger/10" },
};

export default async function MatchReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/match/${id}`)}`);
  const analysis = await getAnalysisForUser(user.id, id);
  if (!analysis) notFound();
  const report = analysis.result as MatchReport;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/match" className="text-sm text-ink-muted hover:text-ink">← 返回匹配</Link>
      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="surface-card h-fit p-6 text-center">
          <p className="eyebrow">Job match</p>
          <p className={`mt-4 font-display text-7xl font-bold ${
            report.score >= 75 ? "text-accent-success" : report.score >= 45 ? "text-accent-warn" : "text-accent-danger"
          }`}>{report.score}</p>
          <p className="mt-1 text-sm text-ink-muted">匹配分 / 100</p>
          <p className="mt-4 text-sm leading-6 text-ink-soft">{report.summary}</p>
          <div className="mt-5 space-y-2">
            <Link href="/dashboard" className="btn-secondary w-full">返回工作台</Link>
            <Link href="/editor/new" className="btn-ghost w-full">调整一份新简历</Link>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Requirements</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-ink">岗位要求逐项对照</h1>
              </div>
              <span className="text-xs text-ink-muted">来源：{analysis.fileName}</span>
            </div>
            <div className="mt-5 space-y-3">
              {report.requirements.length ? report.requirements.map((item, index) => {
                const meta = statusMeta[item.status];
                const Icon = meta.icon;
                return (
                  <article key={`${item.requirement}-${index}`} className="rounded-md border border-surface-line bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.tone}`}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-6 text-ink">{item.requirement}</p>
                        <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] ${meta.tone}`}>{meta.label}</span>
                        <p className="mt-2 text-xs leading-5 text-ink-muted">依据：{item.evidence}</p>
                        <p className="mt-1.5 text-xs leading-5 text-ink-soft">建议：{item.suggestion}</p>
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <p className="text-sm text-ink-muted">没有拆解出清晰的岗位要求，请补充更完整的 JD 后重试。</p>
              )}
            </div>
          </section>

          {report.missingKeywords.length ? (
            <section className="surface-card p-5 sm:p-6">
              <p className="eyebrow">Gaps</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink">需要补充的关键词</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.missingKeywords.map((item) => <span key={item} className="tag border-accent-danger/30 text-accent-danger">{item}</span>)}
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                只有在真实具备相关经历时才补充。不要为了匹配关键词虚构项目或技能。
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}