import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Download, FileText, LockKeyhole, Sparkles } from "lucide-react";
import { getTemplateBySlug } from "@/lib/templates";
import { getSessionUser } from "@/lib/auth/current-user";
import { getDb, schema } from "@/db";
import SaveTemplateButton from "@/components/save-template-button";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) notFound();

  const user = await getSessionUser();
  let saved = false;
  if (user) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.savedTemplates)
      .where(
        and(
          eq(schema.savedTemplates.userId, user.id),
          eq(schema.savedTemplates.templateId, template.id),
        ),
      )
      .limit(1);
    saved = rows.length > 0;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/templates" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={15} /> 返回模板中心
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="overflow-hidden rounded-lg border border-surface-line bg-surface-card p-4 sm:p-8">
          {template.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.previewUrl}
              alt={`${template.title}完整预览`}
              className="mx-auto max-h-[820px] w-auto max-w-full border border-surface-line bg-white object-contain shadow-lg"
            />
          ) : (
            <div className="flex min-h-[500px] items-center justify-center text-ink-muted">暂无预览图</div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{template.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">{template.title}</h1>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{template.description}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {template.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-surface-line py-4 text-sm">
            <div>
              <p className="text-xs text-ink-muted">格式</p>
              <p className="mt-1 font-medium text-ink">Word / DOCX</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">价格</p>
              <p className="mt-1 font-medium text-accent-success">免费</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">下载次数</p>
              <p className="mt-1 font-medium text-ink">{template.downloadCount}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">获取方式</p>
              <p className="mt-1 font-medium text-ink">免登录下载</p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <a href={`/api/templates/${template.slug}/download`} className="btn-primary w-full">
              <Download size={16} /> 免费下载 Word 模板
            </a>
            <Link href={`/editor/new?template=${template.slug}`} className="btn-secondary w-full">
              <FileText size={16} /> 使用此模板在线填写
            </Link>
            <SaveTemplateButton templateId={template.id} initialSaved={saved} loggedIn={Boolean(user)} />
          </div>

          <div className="mt-5 rounded-md bg-white/70 p-4 text-xs leading-6 text-ink-muted">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <LockKeyhole size={14} /> 关于在线编辑
            </p>
            <p className="mt-1.5">
              下载得到的是可自行修改的 Word 文件。在线填写会创建一份结构化简历，保存和 AI 分析需要登录。
            </p>
          </div>

          <Link href="/analysis" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary-pine hover:underline">
            <Sparkles size={15} /> 已有简历？先免费诊断一下
          </Link>
        </aside>
      </div>
    </main>
  );
}