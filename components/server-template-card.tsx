import type { ServerTemplate } from "@/lib/remote-templates";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ServerTemplateCard({ template }: { template: ServerTemplate }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-surface-line bg-surface-card transition-all hover:-translate-y-0.5 hover:border-primary-teal/40 hover:shadow-lg">
      <a
        href={`/api/xcx/resume-templates/${template.id}/download`}
        className="block aspect-[0.74] overflow-hidden bg-surface-base"
        title="下载服务端模板"
      >
        {template.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewUrl}
            alt={`${template.name}预览`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">暂无预览</div>
        )}
      </a>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-medium text-ink">{template.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-ink-muted">
              {template.description || `${template.categoryName}模板，支持下载 Word 文件。`}
            </p>
          </div>
          <span className="shrink-0 rounded bg-primary-pine/10 px-2 py-1 text-[11px] font-medium text-primary-pine">
            {template.isFree ? "免费" : "需解锁"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="tag">{template.categoryName}</span>
          {template.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-surface-line/70 pt-3">
          <span className="text-[11px] text-ink-muted">
            {template.fileSize ? formatSize(template.fileSize) : "DOCX"}
          </span>
          <a
            href={`/api/xcx/resume-templates/${template.id}/download`}
            className="rounded bg-primary-pine px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            下载模板
          </a>
        </div>
      </div>
    </article>
  );
}