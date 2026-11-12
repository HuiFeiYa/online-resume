import Link from "next/link";
import { Download } from "lucide-react";
import type { TemplateItem } from "@/lib/templates";

export default function TemplateCard({ template }: { template: TemplateItem }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-surface-line bg-surface-card transition-all hover:-translate-y-0.5 hover:border-primary-teal/40 hover:shadow-lg">
      <Link href={`/templates/${template.slug}`} className="block aspect-[0.74] overflow-hidden bg-surface-base">
        {template.previewUrl ? (
          // Template previews are remote R2 images; keep plain img so no host config is required.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewUrl}
            alt={`${template.title}预览`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">暂无预览</div>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-ink">{template.title}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-ink-muted">{template.description}</p>
          </div>
          <span className="shrink-0 rounded bg-primary-pine/10 px-2 py-1 text-[11px] font-medium text-primary-pine">免费</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-surface-line/70 pt-3">
          <span className="text-[11px] text-ink-muted">{template.downloadCount} 次下载</span>
          <a
            href={`/api/templates/${template.slug}/download`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-pine hover:underline"
          >
            <Download size={13} /> 下载
          </a>
        </div>
      </div>
    </article>
  );
}