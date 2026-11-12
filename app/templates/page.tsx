import Link from "next/link";
import { Search } from "lucide-react";
import { listTemplates, templateCategories } from "@/lib/templates";
import TemplateCard from "@/components/template-card";

export const metadata = { title: "简历模板" };

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const category = params.category || "全部";
  const sort = params.sort === "popular" || params.sort === "latest" ? params.sort : "recommended";
  const allTemplates = await listTemplates();
  const templates = await listTemplates({ q, category, sort });
  const categories = templateCategories(allTemplates);

  function href(nextCategory: string) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (sort !== "recommended") search.set("sort", sort);
    if (nextCategory !== "全部") search.set("category", nextCategory);
    const query = search.toString();
    return query ? `/templates?${query}` : "/templates";
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 border-b border-surface-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Template library</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">免费简历模板</h1>
          <p className="mt-2 text-sm text-ink-muted">当前模板全部免费，下载无需登录。选择版式后可以直接在线填写。</p>
        </div>
        <form className="flex w-full gap-2 sm:w-auto">
          {category !== "全部" ? <input type="hidden" name="category" value={category} /> : null}
          {sort !== "recommended" ? <input type="hidden" name="sort" value={sort} /> : null}
          <div className="relative flex-1 sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索岗位、风格或标签"
              className="field-input pl-9"
            />
          </div>
          <button className="btn-primary">搜索</button>
        </form>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <Link
              key={item}
              href={href(item)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                item === category
                  ? "border-primary-pine bg-primary-pine text-white"
                  : "border-surface-line bg-white text-ink-muted hover:text-ink"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 rounded-md border border-surface-line bg-white p-1 text-xs">
          {[
            ["recommended", "推荐"],
            ["popular", "最热"],
            ["latest", "最新"],
          ].map(([key, label]) => {
            const search = new URLSearchParams();
            if (q) search.set("q", q);
            if (category !== "全部") search.set("category", category);
            if (key !== "recommended") search.set("sort", key);
            return (
              <Link
                key={key}
                href={search.size ? `/templates?${search.toString()}` : "/templates"}
                className={`rounded px-3 py-1.5 ${sort === key ? "bg-surface-base font-medium text-ink" : "text-ink-muted"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
        <span>共 {templates.length} 个模板</span>
        {q ? <span>搜索“{q}”</span> : null}
      </div>

      {templates.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="surface-card mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <p className="font-medium text-ink">没有找到匹配的模板</p>
          <p className="mt-2 text-sm text-ink-muted">试试更短的搜索词，或查看全部模板。</p>
          <Link href="/templates" className="btn-secondary mt-5">查看全部</Link>
        </div>
      )}
    </main>
  );
}