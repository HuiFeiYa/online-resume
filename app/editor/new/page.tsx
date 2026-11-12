import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { listTemplates } from "@/lib/templates";
import { getSessionUser } from "@/lib/auth/current-user";
import NewResumeButtons from "@/components/new-resume-buttons";

export const metadata = { title: "新建简历" };

export default async function NewResumePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    const params = await searchParams;
    const query = params.template ? `?template=${params.template}` : "";
    redirect(`/login?next=${encodeURIComponent(`/editor/new${query}`)}`);
  }
  const templates = await listTemplates();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/templates" className="text-sm text-ink-muted hover:text-ink">← 返回模板中心</Link>
      <div className="mt-5">
        <p className="eyebrow">New resume</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">选择简历模板</h1>
        <p className="mt-2 text-sm text-ink-muted">在线填写基于结构化模板，创建后可以随时切换版式。</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="surface-card overflow-hidden">
            <div className="aspect-[0.78] overflow-hidden bg-surface-base">
              {template.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={template.previewUrl} alt={template.title} className="h-full w-full object-cover object-top" />
              ) : null}
            </div>
            <div className="p-4">
              <h2 className="font-medium text-ink">{template.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">{template.description}</p>
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