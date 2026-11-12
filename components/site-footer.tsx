import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-surface-line/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="font-display font-semibold text-ink">简页</span>
          <span className="ml-2">简历工具，免费使用</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/templates" className="hover:text-ink">模板中心</Link>
          <Link href="/analysis" className="hover:text-ink">简历诊断</Link>
          <Link href="/match" className="hover:text-ink">JD 匹配</Link>
          <Link href="/consult" className="hover:text-ink">咨询交流</Link>
        </div>
      </div>
    </footer>
  );
}