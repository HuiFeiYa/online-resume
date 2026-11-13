"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutTemplate, ScanSearch, Sparkles, Users } from "lucide-react";

const nav = [
  { href: "/templates", label: "模板中心", icon: LayoutTemplate },
  { href: "/editor/new", label: "在线制作", icon: FileText },
  { href: "/analysis", label: "简历诊断", icon: ScanSearch },
  { href: "/match", label: "JD 匹配", icon: Sparkles },
  { href: "/consult", label: "咨询交流", icon: Users },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/templates") {
    return pathname === "/templates" || pathname.startsWith("/templates/");
  }
  if (href === "/editor/new") {
    return (
      pathname === "/editor/new" ||
      pathname === "/editor/start" ||
      pathname === "/editor/draft" ||
      pathname.startsWith("/editor/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  return (
    <>
      {nav.map((item) => {
        const active = isActivePath(pathname, item.href);
        if (variant === "desktop") {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary-pine/10 font-medium text-primary-pine"
                  : "text-ink-muted hover:bg-surface-card hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={15} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors ${
              active
                ? "bg-primary-pine text-white"
                : "text-ink-muted hover:bg-surface-card"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}