import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, Target } from "lucide-react";
import UploadAnalyzer from "@/components/upload-analyzer";
import { getSessionUser } from "@/lib/auth/current-user";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const metadata = { title: "简历诊断" };

export default async function AnalysisPage() {
  const user = await getSessionUser();
  let recent: Array<typeof schema.analysisJobs.$inferSelect> = [];
  if (user) {
    const db = await getDb();
    recent = await db
      .select()
      .from(schema.analysisJobs)
      .where(eq(schema.analysisJobs.userId, user.id))
      .orderBy(desc(schema.analysisJobs.createdAt))
      .limit(6);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow">Resume review</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">简历诊断与评分</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
            上传现有简历，从 6 个维度检查完整性、成果表达、结构和可读性。报告会指出具体问题、原文证据和可执行的修改方向。
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileSearch, title: "逐项检查", text: "找出缺失信息和表达问题" },
              { icon: Target, title: "结果导向", text: "关注量化成果与关键词" },
              { icon: ShieldCheck, title: "隐私可控", text: "报告按账号隔离存储" },
            ].map((item) => (
              <div key={item.title} className="surface-card p-4">
                <item.icon size={19} className="text-primary-pine" />
                <p className="mt-3 text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{item.text}</p>
              </div>
            ))}
          </div>

          {recent.length ? (
            <section className="mt-9">
              <h2 className="font-display text-xl font-bold text-ink">最近分析</h2>
              <div className="mt-3 divide-y divide-surface-line rounded-lg border border-surface-line bg-white">
                {recent.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${item.kind === "jd" ? "match" : "analysis"}/${item.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-surface-base"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-pine/10 text-xs font-semibold text-primary-pine">
                      {item.score ?? "-"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.kind === "jd" ? "JD 匹配" : "简历诊断"} · {item.fileName || "未命名"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                      </p>
                    </div>
                    <ArrowRight size={15} className="text-ink-muted" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 rounded-lg border border-surface-line bg-primary-pine/5 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <CheckCircle2 size={16} className="text-accent-success" /> 分析结果怎么用
            </p>
            <ol className="mt-2 space-y-1.5 text-sm leading-6 text-ink-muted">
              <li>先修复高风险问题，例如缺少联系方式、经历没有结果。</li>
              <li>再用 JD 匹配检查岗位关键词和硬性要求。</li>
              <li>最后回到编辑器修改并重新导出。</li>
            </ol>
          </div>
        </div>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-ink">上传简历</h2>
          <p className="mt-1 text-sm text-ink-muted">当前免费，登录后即可使用。</p>
          <div className="mt-5">
            <UploadAnalyzer />
          </div>
          {!user ? (
            <p className="mt-4 text-center text-xs text-ink-muted">
              还没有账号？<Link href="/register" className="font-medium text-primary-pine hover:underline">免费注册</Link>
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}