import Link from "next/link";
import { getSessionUser } from "@/lib/auth/current-user";
import { Bookmark, FileText, LayoutTemplate, ScanSearch, Sparkles, Users } from "lucide-react";
import LogoutButton from "@/components/logout-button";

const nav = [
  { href: "/templates", label: "模板中心", icon: LayoutTemplate },
  { href: "/editor/new", label: "在线制作", icon: FileText },
  { href: "/analysis", label: "简历诊断", icon: ScanSearch },
  { href: "/match", label: "JD 匹配", icon: Sparkles },
  { href: "/consult", label: "咨询交流", icon: Users },
];

export default async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-surface-line/70 bg-surface-base/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-pine text-sm font-bold text-white">
            简
          </span>
          <span className="font-display text-[19px] font-bold tracking-normal text-ink">简页</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-card hover:text-ink"
            >
              <item.icon size={15} strokeWidth={1.8} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-md px-3 py-2 text-sm text-ink-muted hover:text-ink sm:block"
              >
                我的工作台
              </Link>
              <Link
                href="/dashboard/saved"
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm text-ink-muted hover:text-ink sm:flex"
              >
                <Bookmark size={14} /> 收藏
              </Link>
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="hidden rounded-md px-3 py-2 text-sm text-ink-muted hover:text-ink sm:block"
                >
                  管理
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-pine text-xs font-semibold text-white"
                title={user.username}
              >
                {user.username.slice(0, 1).toUpperCase()}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm text-ink-muted hover:text-ink"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary-pine px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                免费注册
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-surface-line/50 px-4 py-2 lg:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-card"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}