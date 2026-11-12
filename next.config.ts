import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 为 Node 原生模块、@libsql/client 含二进制依赖，
  // 必须外部化，否则 Next.js 打包（build/部署到 Vercel）会失败。
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  // 锁定工作区根目录为本项目：避免上层目录存在多余 package-lock.json 时，
  // Next.js 误判 workspace root 导致构建扫描范围异常。
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [];
  },
};

export default nextConfig;
