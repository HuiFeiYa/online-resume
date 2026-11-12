import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Plus, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth/current-user";
import { getUserResumes } from "@/lib/resume/store";
import { getTemplateById } from "@/lib/templates";

export const metadata = { title: "工作台" };

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const resumes = await getUserResumes(user.id);
  const templates = await Promise.all(resumes.map((resume) => getTemplateById(resume.templateId)));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">你好，{user.displayName || user.email}</h1>
          <p className="mt-2 text-sm text-ink-muted">你的简历和分析记录都在这里。</p>
        </div>
        <div className="flex gap-2">
          <Link href="/editor/new" className="btn-primary"><Plus size={15} /> 新建简历</Link>
          <Link href="/analysis" className="btn-secondary"><Sparkles size={15} /> 诊断简历</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs text-ink-muted">我的简历</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{resumes.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-ink-muted">最近更新</p>
          <p className="mt-2 text-base font-medium text-ink">{resumes.length ? dateLabel(resumes[0].updatedAt) : "还没有简历"}</p>
        </div>
        <Link href="/consult" className="surface-card group p-5 transition-colors hover:border-primary-teal/40">
          <p className="text-xs text-ink-muted">需要人工建议？</p>
          <p className="mt-2 flex items-center gap-1.5 text-base font-medium text-primary-pine">免费咨询 <ArrowRight size={15} /></p>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">我的简历</h2>
          <Link href="/templates" className="text-sm text-primary-pine hover:underline">从模板新建</Link>
        </div>
        {resumes.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resumes.map((resume, index) => (
              <Link key={resume.id} href={`/editor/${resume.id}`} className="surface-card group p-5 transition-colors hover:border-primary-teal/50 hover:bg-white">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-pine/10 text-primary-pine">
                    <FileText size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-ink">{resume.title}</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {templates[index]?.title || "简历模板"} · {dateLabel(resume.updatedAt)}
                    </p>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-muted">
                      {resume.data.basics.summary || "继续完善你的个人简介、工作经历与项目成果。"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-surface-line/70 pt-3 text-xs text-ink-muted">
                  <span>{resume.data.basics.name || "未填写姓名"}</span>
                  <span className="flex items-center gap-1 text-primary-pine">继续编辑 <ArrowRight size={13} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <FileText size={28} className="text-primary-pine/60" />
            <h3 className="mt-3 font-medium text-ink">还没有创建简历</h3>
            <p className="mt-1 text-sm text-ink-muted">选一个模板开始，内容会自动保存。</p>
            <Link href="/templates" className="btn-primary mt-5">选择模板</Link>
          </div>
        )}
      </section>
    </main>
  );
}