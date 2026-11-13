import Link from "next/link";
import { ArrowRight, Check, Download, FileSearch, Layers, ShieldCheck } from "lucide-react";
import { listServerTemplates } from "@/lib/remote-templates";
import ServerTemplateCard from "@/components/server-template-card";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof listServerTemplates>>["templates"] = [];
  let templateCount = 0;
  try {
    const result = await listServerTemplates({ sort: "popular" });
    featured = result.templates.slice(0, 4);
    templateCount = result.total;
  } catch (error) {
    console.error("[home] 服务端模板加载失败", error);
  }

  return (
    <main>
      <section className="border-b border-surface-line/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow">免费简历工具</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.18] text-ink sm:text-5xl">
              从一份好简历开始，
              <br />
              把求职准备做扎实。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-ink-muted">
              挑选免费模板，直接在线填写。上传旧简历获取评分与修改建议，再用目标岗位 JD 做一次精准匹配。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/templates" className="btn-primary">
                浏览免费模板 <ArrowRight size={16} />
              </Link>
              <Link href="/analysis" className="btn-secondary">
                免费诊断简历
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {["模板下载免登录", "在线编辑自动保存", "AI 建议可直接落地"].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check size={14} className="text-accent-success" /> {text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-0 lg:min-h-[340px]">
            <div className="absolute right-4 top-2 hidden h-[310px] w-[218px] rotate-6 rounded-md border border-surface-line bg-white p-4 shadow-xl lg:block">
              <div className="h-2 w-16 rounded bg-primary-pine/80" />
              <div className="mt-3 h-1.5 w-28 rounded bg-surface-line" />
              <div className="mt-8 h-1.5 w-20 rounded bg-primary-teal/40" />
              <div className="mt-3 space-y-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-1.5 rounded bg-surface-line/80" style={{ width: `${92 - n * 6}%` }} />
                ))}
              </div>
              <div className="mt-7 h-1.5 w-24 rounded bg-primary-teal/40" />
              <div className="mt-3 space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-1.5 rounded bg-surface-line/80" style={{ width: `${88 - n * 4}%` }} />
                ))}
              </div>
            </div>
            <div className="relative z-10 mr-8 hidden w-[236px] -rotate-3 rounded-md border border-surface-line bg-white p-5 shadow-2xl lg:block">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-20 rounded bg-ink/80" />
                  <div className="mt-2 h-1.5 w-14 rounded bg-surface-line" />
                </div>
                <div className="h-10 w-10 rounded-full bg-primary-pine/10" />
              </div>
              <div className="mt-6 border-t border-surface-line pt-4">
                <div className="h-1.5 w-12 rounded bg-primary-pine/60" />
                <div className="mt-3 space-y-2">
                  {[96, 88, 92, 73].map((w) => <div key={w} className="h-1.5 rounded bg-surface-line/80" style={{ width: `${w}%` }} />)}
                </div>
              </div>
              <div className="mt-5 border-t border-surface-line pt-4">
                <div className="h-1.5 w-16 rounded bg-primary-pine/60" />
                <div className="mt-3 space-y-2">
                  {[90, 84, 95].map((w) => <div key={w} className="h-1.5 rounded bg-surface-line/80" style={{ width: `${w}%` }} />)}
                </div>
              </div>
              <div className="mt-6 flex gap-1.5">
                <span className="rounded bg-primary-pine/10 px-2 py-1 text-[9px] text-primary-pine">用户增长</span>
                <span className="rounded bg-primary-pine/10 px-2 py-1 text-[9px] text-primary-pine">数据分析</span>
              </div>
            </div>
            <div className="surface-card relative z-20 mt-7 grid grid-cols-3 gap-3 p-4 lg:absolute lg:bottom-2 lg:left-8 lg:right-auto lg:mt-0 lg:w-[300px]">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-ink">{templateCount ? `${templateCount}+` : "18+"}</p>
                <p className="mt-1 text-[11px] text-ink-muted">服务端模板</p>
              </div>
              <div className="border-x border-surface-line text-center">
                <p className="font-display text-2xl font-bold text-ink">6 维</p>
                <p className="mt-1 text-[11px] text-ink-muted">简历评分</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-ink">0 元</p>
                <p className="mt-1 text-[11px] text-ink-muted">当前全免费</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Download, title: "免费模板下载", text: "服务端精选模板，预览后免费下载 Word。", href: "/templates" },
            { icon: Layers, title: "在线简历编辑", text: "结构化填写，A4 实时预览，自动保存。", href: "/editor/new" },
            { icon: FileSearch, title: "简历诊断评分", text: "从完整度、影响力、表达等维度给出建议。", href: "/analysis" },
            { icon: ShieldCheck, title: "JD 匹配分析", text: "逐项拆解岗位要求，找到关键词与经历差距。", href: "/match" },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="surface-card group p-5 transition-colors hover:border-primary-teal/50 hover:bg-white">
              <item.icon size={22} strokeWidth={1.7} className="text-primary-pine" />
              <h2 className="mt-4 text-base font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-pine">
                开始使用 <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Template library</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">热门简历模板</h2>
            <p className="mt-1 text-sm text-ink-muted">从服务端模板库精选，选择喜欢的版式后直接下载。</p>
          </div>
          <Link href="/templates" className="hidden items-center gap-1 text-sm text-primary-pine hover:underline sm:flex">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length ? (
            featured.map((template) => (
              <ServerTemplateCard key={template.id} template={template} />
            ))
          ) : (
            <div className="surface-card col-span-full p-8 text-center">
              <p className="text-sm text-ink-muted">热门模板暂时无法加载，请前往模板中心查看。</p>
              <Link href="/templates" className="btn-secondary mt-4">打开模板中心</Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid items-center gap-8 rounded-lg bg-primary-pine px-6 py-10 text-white sm:px-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Free consultation</p>
            <h2 className="mt-3 font-display text-2xl font-bold">简历改了很多遍，还是不知道问题在哪？</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
              可以先提交一次免费咨询，或加入求职交流群。我们会围绕简历结构、投递方向和岗位匹配给出具体建议。
            </p>
          </div>
          <Link href="/consult" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-medium text-primary-pine">
            免费咨询 <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}