import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, Target } from "lucide-react";
import UploadAnalyzer from "@/components/upload-analyzer";
import { getSessionUser } from "@/lib/auth/current-user";
import { getMembershipPricing, getQuotaStatus } from "@/lib/quota";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const metadata = { title: "简历诊断" };

export default async function AnalysisPage() {
  const user = await getSessionUser();
  let recent: Array<typeof schema.analysisJobs.$inferSelect> = [];
  let quota = null;
  const pricing = await getMembershipPricing();
  if (user) {
    quota = await getQuotaStatus(user.id, "resume_analysis");
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
            上传现有简历，由大模型按 V2 规则评估信息完整度、岗位匹配度、经历质量与成果量化、职业轨迹与稳定性。报告会给出原文证据和可执行的修改方向。
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileSearch, title: "四维诊断", text: "经历质量占 45 分核心权重" },
              { icon: Target, title: "结果导向", text: "检查动词、量化与价值归因" },
              { icon: ShieldCheck, title: "全程可追踪", text: "流式展示模型分析进度" },
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
              <li>先修复高风险问题，重点是经历中没有成果证据的部分。</li>
              <li>有目标岗位时填写 JD，让系统检查硬性要求和关键词覆盖。</li>
              <li>最后回到编辑器修改并重新导出。</li>
            </ol>
          </div>
        </div>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-ink">上传简历</h2>
          <p className="mt-1 text-sm text-ink-muted">登录后由大模型完成深度诊断。</p>
          <div className="mt-5">
            <UploadAnalyzer
              remaining={quota?.remaining ?? 2}
              vip={quota?.vip ?? false}
              pricing={pricing}
            />
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