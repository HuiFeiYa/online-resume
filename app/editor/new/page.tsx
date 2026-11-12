import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listTemplates } from "@/lib/templates";
import NewResumeButtons from "@/components/new-resume-buttons";
import ResumePreview from "@/components/resume-preview";
import ResumeFrame from "@/components/resume-frame";
import { createShowcaseResume } from "@/lib/resume/showcase";
import { rendererLabel } from "@/lib/renderers";

export const metadata = { title: "新建简历" };

export default async function NewResumePage() {
  const templates = await listTemplates();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/templates" className="text-sm text-ink-muted hover:text-ink">← 返回模板中心</Link>
      <div className="mt-5">
        <p className="eyebrow">New resume</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">选择简历模板</h1>
        <p className="mt-2 text-sm text-ink-muted">无需登录即可开始填写。草稿保存在当前浏览器，导出时再登录。</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="surface-card overflow-hidden">
            <div className="border-b border-surface-line bg-surface-base p-2">
              <ResumeFrame className="rounded-sm bg-white shadow-sm">
                <ResumePreview
                  data={createShowcaseResume(template.id)}
                  theme={template.theme}
                  rendererKey={template.rendererKey}
                />
              </ResumeFrame>
            </div>
            <div className="p-4">
              <h2 className="font-medium text-ink">{template.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">{template.description}</p>
              <span className="mt-2 inline-flex rounded bg-primary-pine/10 px-2 py-0.5 text-[11px] text-primary-pine">
                {rendererLabel(template.rendererKey)}
              </span>
              <NewResumeButtons templateSlug={template.slug} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-2 text-sm text-ink-muted">
        <ArrowRight size={14} /> 已经写过简历？<Link href="/analysis" className="font-medium text-primary-pine hover:underline">直接上传诊断</Link>
      </div>
    </main>
  );
}