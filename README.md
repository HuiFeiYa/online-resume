# 简页 - 免费简历工具

个人求职简历网站，基于 Next.js 15 全栈实现。当前所有功能免费，不包含支付和会员体系。

## 功能

- 免费简历模板：模板中心读取服务端模板目录，支持搜索、分类、预览和代理下载 Word 文件。
- 在线简历编辑：独立提供 8 套结构化可编辑版式，无需登录即可填写，草稿保存在浏览器，导出时再登录。
- 简历诊断：上传 DOCX/PDF，按 6 个维度评分并给出问题证据和修改建议。
- JD 匹配：选择在线简历并粘贴岗位描述，逐项输出满足情况、证据与差距。
- 免费咨询：群二维码占位、咨询线索表单、管理后台线索查看。
- 账号与隔离：昵称加密码注册登录，简历和分析报告按用户隔离。

## 技术栈

- Next.js 15 App Router、React 19、TypeScript strict、Tailwind CSS 3.4
- Drizzle ORM、本地 SQLite、生产 Turso/libSQL
- Cloudflare R2 存储适配
- OpenAI-compatible 模型适配（Qwen、DeepSeek、GLM）
- Mammoth 解析 DOCX、unpdf 解析 PDF、docx 生成 Word
- Vitest 单元测试、Playwright 端到端测试

## 快速开始

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认地址：`http://localhost:3000`。未配置任何云服务时，会使用本地 `local.db`，AI 分析自动降级为本地规则分析。

Node.js 要求 `>=22`。

## 环境变量

```bash
# 鉴权（生产必须设置）
AUTH_SECRET=

# 数据库，留空使用本地 SQLite
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# R2（当前模板资源使用远程公开图片，未配置也可运行）
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=

# 服务端模板已内置在 /api/xcx/resume-templates，无需外部地址
# TEMPLATE_STORE_API_BASE_URL=

# 模型（未配置时使用本地规则分析）
LLM_PROVIDER=qwen
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_STRONG_MODEL=
```

## 常用命令

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run deploy
```

## 数据库

运行时会在首次访问时幂等创建表。核心表：

- `users`：账号与角色
- `template_items`：模板目录
- `saved_templates`：收藏
- `resumes`：结构化简历
- `analysis_jobs`：诊断与 JD 匹配报告
- `consultation_leads`：咨询线索
- `download_events`：下载记录

## 管理后台

将用户表中某个账号的 `role` 改为 `admin` 后，可从顶部导航进入 `/admin`。管理后台当前展示模板状态、咨询线索和最近分析记录。

## 上线前检查

- 设置随机长串 `AUTH_SECRET`。
- 配置 Turso 和 R2，避免生产环境使用本地数据库。
- 配置模型 Key 后才启用 AI 语义分析；否则只使用确定性规则。
- 检查模板数据是否由 `SUPPORTED_TEMPLATES` 正确同步。
- 替换咨询页中的群二维码占位。