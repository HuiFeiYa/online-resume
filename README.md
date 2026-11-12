# Next Starter（通用 Next.js 全栈模板）

从 `next-starter` skill 拷贝而来的脚手架，已内置：

- **Vercel 部署**：`next.config.ts` 外部化原生模块 + `scripts/vercel-deploy.mjs` 代理/MTU 探测
- **R2 对象存储**：`lib/storage/r2.ts` 零依赖 SigV4 上传/删除
- **数据库**：`db/index.ts` 本地 better-sqlite3 与云端 Turso 双模单例
- **大模型**：`lib/llm/` 多 provider（qwen/deepseek/glm/openai-compatible）适配器
- **鉴权**：`lib/auth/` cookie-session 骨架

## 快速开始

```bash
npm install
cp .env.example .env.local   # 按需填入 R2 / TURSO / LLM / AUTH 变量
npm run dev                  # http://localhost:3000
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run deploy` | 部署到 Vercel（含代理/MTU 探测） |
| `npm run db:migrate` | 本地执行 drizzle 迁移 |
| `npm run db:migrate:prod` | 生产执行迁移（注入 Turso 变量） |

## 本地数据库

未配置 `TURSO_DATABASE_URL` 时自动连接 `./local.db`（better-sqlite3），表结构在首次 `getDb()` 时幂等创建，无需手动迁移即可运行。

## 上线前检查

- `package.json` 的 `engines.node >=22`（决定 Vercel 构建 Node 版本）
- `next.config.ts` 的 `serverExternalPackages` 保留（原生模块打包必需）
- 设置 `AUTH_SECRET`（随机长串）
- R2 / LLM 相关环境变量在 Vercel 项目设置中配置
