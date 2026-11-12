import { readFileSync } from "node:fs";

/**
 * 从 .env.local 解析 Turso 配置并注入环境变量（不覆盖 shell 已设置的变量）。
 *
 * 用途：「生产环境」脚本（迁移 / 种子）按需注入，避免在本地开发时误连线上库——
 * db/index.ts 按「是否设置 TURSO_DATABASE_URL」选库，一旦生效，本地 npm run dev
 * 也会打到生产数据。因此默认保持注释（# TURSO_DATABASE_URL=...），仅由 *:prod 脚本注入。
 *
 * 兼容两种写法：
 *   - 注释行  `# TURSO_DATABASE_URL=...`（推荐，避免 dev 误连线上库）
 *   - 非注释行 `TURSO_DATABASE_URL=...`（当 .env.local 已为 prod 直连而保持未注释时也能被 *:prod 脚本识别）
 * 变量优先级：shell 已设置的 TURSO_DATABASE_URL > .env.local 中的行。
 */
export function loadTursoEnvFromComments() {
  if (process.env.TURSO_DATABASE_URL) return;
  let content: string;
  try {
    content = readFileSync(".env.local", "utf-8");
  } catch {
    return;
  }
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const m = /^(?:#\s*)?(TURSO_(?:DATABASE_URL|AUTH_TOKEN))=(.+)$/.exec(raw.trim());
    if (!m) continue;
    const val = m[2].trim().replace(/^"(.*)"$/, "$1");
    if (val) process.env[m[1]] = val;
  }
}
