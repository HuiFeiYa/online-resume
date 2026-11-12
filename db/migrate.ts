import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { migrate as migrateLibsql } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

/**
 * 执行 drizzle-kit 生成的 SQL 迁移（./drizzle）。
 * 若使用运行时 ensureSchema 自动建表，可不必运行本脚本；
 * 本脚本面向「需要正式迁移历史」的场景。
 */
async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzleLibsql(client, { schema });
    await migrateLibsql(db, { migrationsFolder: "./drizzle" });
  } else {
    const sqlite = new Database("./local.db");
    sqlite.pragma("journal_mode = WAL");
    const db = drizzle(sqlite, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
  }
  console.log("✓ 迁移完成");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ 迁移失败", err);
  process.exit(1);
});
