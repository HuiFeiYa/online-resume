import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import type { TemplateItem } from "@/lib/templates";
import { createShowcaseResume } from "@/lib/resume/showcase";
import ResumePreview from "@/components/resume-preview";
import ResumeFrame from "@/components/resume-frame";
import { rendererLabel } from "@/lib/renderers";

export default function TemplateCard({ template }: { template: TemplateItem }) {
  const example = createShowcaseResume(template.id);

  return (
    <article className="group overflow-hidden rounded-lg border border-surface-line bg-surface-card transition-all hover:-translate-y-0.5 hover:border-primary-teal/40 hover:shadow-lg">
      <Link href={`/templates/${template.slug}`} className="block border-b border-surface-line bg-surface-base p-2">
        <ResumeFrame className="rounded-sm bg-white shadow-sm" height={1123}>
          <ResumePreview data={example} theme={template.theme} rendererKey={template.rendererKey} />
        </ResumeFrame>
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
          <span className="tag">{rendererLabel(template.rendererKey)}</span>
          {template.tags.slice(0, 1).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-surface-line/70 pt-3">
          <span className="text-[11px] text-ink-muted">{template.downloadCount} 次下载</span>
          <Link
            href={`/editor/start?template=${template.slug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-pine hover:underline"
          >
            开始制作 <ArrowRight size={13} />
          </Link>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <a href={`/api/templates/${template.slug}/download`} className="flex items-center justify-center gap-1 rounded border border-surface-line py-1.5 text-[11px] text-ink-muted hover:text-ink">
            <Download size={12} /> Word
          </a>
          <a href={`/api/templates/${template.slug}/download/pdf`} className="flex items-center justify-center gap-1 rounded border border-surface-line py-1.5 text-[11px] text-ink-muted hover:text-ink">
            <Download size={12} /> PDF
          </a>
        </div>
      </div>
    </article>
  );
}