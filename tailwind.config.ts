import type { Config } from "tailwindcss";

/**
 * 配色基于 CSS 变量（见 app/globals.css）：
 * - 站点双主题 editorial（纸张朱砂·浅色）/ brutal（黑白极简·深色）通过
 *   <html data-theme="..."> 切换，所有颜色 token 即时联动。
 * - --c-* 为站点主色板，--cover-* 为 shadcn/ui 语义色（供通用组件使用）。
 * darkMode 跟随 data-theme="brutal"，可用 dark: 变体（但本项目主题主要由 globals.css 的
 * [data-theme="brutal"] 覆盖实现）。
 */
const config: Config = {
  darkMode: ["class", '[data-theme="brutal"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          pine: "rgb(var(--c-primary-pine) / <alpha-value>)",
          deep: "rgb(var(--c-primary-deep) / <alpha-value>)",
          teal: "rgb(var(--c-primary-teal) / <alpha-value>)",
          gold: "rgb(var(--c-primary-gold) / <alpha-value>)",
          // shadcn 语义别名：DEFAULT=站点强调色，随双主题联动
          DEFAULT: "var(--cover-primary)",
          foreground: "var(--cover-primary-fg)",
        },
        surface: {
          base: "rgb(var(--c-surface-base) / <alpha-value>)",
          card: "rgb(var(--c-surface-card) / <alpha-value>)",
          raised: "rgb(var(--c-surface-raised) / <alpha-value>)",
          line: "rgb(var(--c-surface-line) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
        },
        accent: {
          success: "rgb(var(--c-accent-success) / <alpha-value>)",
          danger: "rgb(var(--c-accent-danger) / <alpha-value>)",
          warn: "rgb(var(--c-accent-warn) / <alpha-value>)",
          DEFAULT: "var(--cover-accent)",
          foreground: "var(--cover-accent-fg)",
        },
        // shadcn/ui 语义 token（深色由 data-theme 覆盖）
        background: "var(--cover-bg)",
        foreground: "var(--cover-fg)",
        card: { DEFAULT: "var(--cover-card)", foreground: "var(--cover-card-fg)" },
        popover: { DEFAULT: "var(--cover-popover)", foreground: "var(--cover-popover-fg)" },
        secondary: { DEFAULT: "var(--cover-secondary)", foreground: "var(--cover-secondary-fg)" },
        muted: { DEFAULT: "var(--cover-muted)", foreground: "var(--cover-muted-fg)" },
        destructive: { DEFAULT: "var(--cover-destructive)", foreground: "var(--cover-destructive-fg)" },
        border: "var(--cover-border)",
        input: "var(--cover-input)",
        ring: "var(--cover-ring)",
      },
      fontFamily: {
        serif: ["Playfair Display", "PingFang SC", "Georgia", "serif"],
        sans: ["PingFang SC", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "caret-blink": "caretBlink 1s steps(2, start) infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        caretBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgb(var(--c-primary-teal) / 0.18)",
        "glow-gold": "0 0 36px rgb(var(--c-primary-gold) / 0.16)",
        line: "inset 0 1px 0 rgb(var(--c-surface-line) / 0.35)",
      },
      letterSpacing: {
        display: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
