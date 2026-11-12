import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth/current-user";
import { listTemplates } from "@/lib/templates";

export const metadata = { title: "管理后台" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  const db = await getDb();
  const [leads, analyses, templateCount, resumeCount, downloadCount] = await Promise.all([
    db.select().from(schema.consultationLeads).orderBy(desc(schema.consultationLeads.createdAt)).limit(20),
    db.select().from(schema.analysisJobs).orderBy(desc(schema.analysisJobs.createdAt)).limit(12),
    db.select({ count: sql<number>`count(*)` }).from(schema.templateItems),
    db.select({ count: sql<number>`count(*)` }).from(schema.resumes),
    db.select({ count: sql<number>`count(*)` }).from(schema.downloadEvents),
  ]);
  const templates = await listTemplates();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">管理后台</h1>
      <p className="mt-2 text-sm text-ink-muted">查看核心使用数据、咨询线索和模板状态。</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["模板总数", templateCount[0]?.count ?? 0],
          ["简历总数", resumeCount[0]?.count ?? 0],
          ["下载次数", downloadCount[0]?.count ?? 0],
          ["分析任务", analyses.length],
          ["咨询线索", leads.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface-card p-4">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-surface-line px-5 py-4">
            <h2 className="font-display text-xl font-bold text-ink">咨询线索</h2>
          </div>
          {leads.length ? (
            <div className="divide-y divide-surface-line">
              {leads.map((lead) => (
                <div key={lead.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{lead.name} · {lead.targetRole || "未填写岗位"}</p>
                    <span className="tag">{lead.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{lead.contactType}: {lead.contactValue}</p>
                  {lead.message ? <p className="mt-2 text-sm leading-6 text-ink-soft">{lead.message}</p> : null}
                  <p className="mt-2 text-[11px] text-ink-muted">{new Date(lead.createdAt).toLocaleString("zh-CN")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-ink-muted">暂无咨询线索。</p>
          )}
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-surface-line px-5 py-4">
            <h2 className="font-display text-xl font-bold text-ink">最近分析</h2>
          </div>
          {analyses.length ? (
            <div className="divide-y divide-surface-line">
              {analyses.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-pine/10 text-xs font-semibold text-primary-pine">{item.score ?? "-"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{item.kind === "jd" ? "JD 匹配" : "简历诊断"} · {item.fileName || "未命名"}</p>
                    <p className="text-[11px] text-ink-muted">{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-ink-muted">暂无分析任务。</p>
          )}
        </section>
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="border-b border-surface-line px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">模板状态</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-base/70 text-xs text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-medium">模板</th>
                <th className="px-5 py-3 font-medium">分类</th>
                <th className="px-5 py-3 font-medium">在线编辑</th>
                <th className="px-5 py-3 font-medium">下载量</th>
                <th className="px-5 py-3 font-medium">预览</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-5 py-3 font-medium text-ink">{template.title}</td>
                  <td className="px-5 py-3 text-ink-muted">{template.category}</td>
                  <td className="px-5 py-3 text-ink-muted">{template.editorEnabled ? "支持" : "仅下载"}</td>
                  <td className="px-5 py-3 text-ink-muted">{template.downloadCount}</td>
                  <td className="px-5 py-3"><Link href={`/templates/${template.slug}`} className="text-primary-pine hover:underline">查看</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}