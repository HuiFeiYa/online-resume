import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Bookmark, FileText } from "lucide-react";
import { getSessionUser } from "@/lib/auth/current-user";
import { getDb, schema } from "@/db";
import { getTemplateById } from "@/lib/templates";
import TemplateCard from "@/components/template-card";

export const metadata = { title: "我的收藏" };

export default async function SavedTemplatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/saved");
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.savedTemplates)
    .where(eq(schema.savedTemplates.userId, user.id))
    .orderBy(desc(schema.savedTemplates.createdAt));
  const templates = (await Promise.all(rows.map((row) => getTemplateById(row.templateId)))).filter(Boolean);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">← 工作台</Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Saved templates</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">我收藏的模板</h1>
          <p className="mt-2 text-sm text-ink-muted">收藏只是方便找回模板，下载和在线使用仍然是免费的。</p>
        </div>
        <Link href="/templates" className="btn-secondary"><FileText size={15} /> 浏览模板</Link>
      </div>

      {templates.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => template ? <TemplateCard key={template.id} template={template} /> : null)}
        </div>
      ) : (
        <div className="surface-card mt-6 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <Bookmark size={28} className="text-primary-pine/60" />
          <p className="mt-3 font-medium text-ink">还没有收藏模板</p>
          <p className="mt-1 text-sm text-ink-muted">在模板详情页点击收藏，之后就能从这里快速找到。</p>
          <Link href="/templates" className="btn-primary mt-5">去模板中心</Link>
        </div>
      )}
    </main>
  );
}