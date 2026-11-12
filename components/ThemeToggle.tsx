"use client";

/**
 * 主题切换：editorial（纸张朱砂·浅色） / brutal（黑白极简·Neo-Brutalism·深色）。
 * 通过 <html data-theme="..."> 切换，所有颜色 token 即时联动（见 globals.css）。
 */
import { useEffect, useState } from "react";

type Theme = "editorial" | "brutal";

const STORAGE_KEY = "sologen-theme";

const THEME_OPTIONS: {
  id: Theme;
  label: string;
  title: string;
}[] = [
  { id: "editorial", label: "编辑部", title: "编辑部（纸张朱砂·浅色）" },
  { id: "brutal", label: "黑白极简", title: "黑白极简（Neo-Brutalism·深色）" },
];

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function ContrastIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("editorial");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === "brutal" ? "brutal" : "editorial";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const CurrentIcon = theme === "brutal" ? ContrastIcon : SunIcon;

  return (
    <>
      <div
        className="hidden items-center rounded-xl border border-surface-line bg-ink/[0.04] p-0.5 sm:flex"
        role="group"
        aria-label="主题切换"
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = option.id === "editorial" ? SunIcon : ContrastIcon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => apply(option.id)}
              title={option.title}
              aria-pressed={theme === option.id}
              className={`flex h-7 w-8 items-center justify-center rounded-lg transition ${
                theme === option.id
                  ? "bg-primary-teal/15 text-primary-teal"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      <details className="relative sm:hidden" aria-label="主题切换">
        <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg border border-surface-line bg-ink/[0.04] text-ink-soft transition hover:text-ink [&::-webkit-details-marker]:hidden">
          <CurrentIcon className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-surface-line bg-surface-raised p-1 shadow-2xl">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => apply(option.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                theme === option.id
                  ? "bg-primary-teal/10 text-primary-teal"
                  : "text-ink-soft hover:bg-ink/[0.05] hover:text-ink"
              }`}
            >
              <span>{option.label}</span>
              {theme === option.id && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      </details>
    </>
  );
}
