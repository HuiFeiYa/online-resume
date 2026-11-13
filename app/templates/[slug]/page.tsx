import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Server } from "lucide-react";
import { getServerTemplate, RemoteTemplateError } from "@/lib/remote-templates";

export default async function ServerTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = Number(slug);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let template;
  try {
    template = await getServerTemplate(id);
  } catch (error) {
    if (error instanceof RemoteTemplateError && error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/templates" className="text-sm text-ink-muted hover:text-ink">
          ← 返回模板中心
        </Link>
        <div className="surface-card mt-6 p-8 text-center">
          <Server size={34} className="mx-auto text-accent-danger" />
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">服务端模板暂时无法加载</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {error instanceof Error ? error.message : "请稍后重试"}
          </p>
        </div>
      </main>
    );
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
              alt={`${template.name}完整预览`}
              className="mx-auto max-h-[820px] w-auto max-w-full border border-surface-line bg-white object-contain shadow-lg"
            />
          ) : (
            <div className="flex min-h-[500px] items-center justify-center text-ink-muted">暂无预览图</div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{template.categoryName}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">{template.name}</h1>
          <p className="mt-3 text-sm leading-7 text-ink-muted">
            {template.description || "服务端模板，可直接下载 Word 文件后自行修改。"}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {template.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-surface-line py-4 text-sm">
            <div>
              <p className="text-xs text-ink-muted">来源</p>
              <p className="mt-1 font-medium text-ink">服务端模板目录</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">价格</p>
              <p className="mt-1 font-medium text-accent-success">{template.isFree ? "免费" : "需解锁"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">文件格式</p>
              <p className="mt-1 font-medium text-ink">Word / DOCX</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">文件大小</p>
              <p className="mt-1 font-medium text-ink">
                {template.fileSize ? `${Math.max(1, Math.round(template.fileSize / 1024))} KB` : "未知"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <a href={`/api/xcx/resume-templates/${template.id}/download`} className="btn-primary w-full">
              <Download size={16} /> 下载服务端 Word 模板
            </a>
            <Link href="/editor/new" className="btn-secondary w-full">
              <FileText size={16} /> 去在线制作可编辑简历
            </Link>
          </div>

          <div className="mt-5 rounded-md bg-white/70 p-4 text-xs leading-6 text-ink-muted">
            <p className="font-medium text-ink">下载与在线制作说明</p>
            <p className="mt-1.5">
              这里下载的是服务端原始 Word 模板。在线制作使用站内 8 套结构化版式，可以边填边预览并导出 Word 或 PDF。
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}