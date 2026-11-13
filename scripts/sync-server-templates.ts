/**
 * Sync resume templates from the original template-store Turso database into
 * this project's Turso database.
 *
 * Usage:
 *   TEMPLATE_SOURCE_TURSO_URL=libsql://... \
 *   TEMPLATE_SOURCE_TURSO_TOKEN=... \
 *   TURSO_DATABASE_URL=libsql://... \
 *   TURSO_AUTH_TOKEN=... \
 *   npx tsx scripts/sync-server-templates.ts
 *
 * If source variables are omitted, the script can read the `TURSO_*` values
 * from a local `.env` source file passed as `--source-env <path>`.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

function readEnvFile(file: string): Record<string, string> {
  const values: Record<string, string> = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return values;
}

const sourceEnvArg = process.argv.indexOf("--source-env");
const sourceEnvFile =
  sourceEnvArg >= 0 ? process.argv[sourceEnvArg + 1] : undefined;
const sourceEnv = sourceEnvFile ? readEnvFile(path.resolve(sourceEnvFile)) : {};
const targetEnv = readEnvFile(path.resolve(".env.production.local"));

const sourceUrl =
  process.env.TEMPLATE_SOURCE_TURSO_URL ||
  sourceEnv.TURSO_DATABASE_URL ||
  process.env.SOURCE_TURSO_DATABASE_URL;
const sourceToken =
  process.env.TEMPLATE_SOURCE_TURSO_TOKEN ||
  sourceEnv.TURSO_AUTH_TOKEN ||
  process.env.SOURCE_TURSO_AUTH_TOKEN;
const targetUrl =
  process.env.TURSO_DATABASE_URL || targetEnv.TURSO_DATABASE_URL;
const targetToken =
  process.env.TURSO_AUTH_TOKEN || targetEnv.TURSO_AUTH_TOKEN;

if (!sourceUrl || !sourceToken) {
  console.error(
    "缺少源数据库凭据：请设置 TEMPLATE_SOURCE_TURSO_URL / TEMPLATE_SOURCE_TURSO_TOKEN，或使用 --source-env <path>",
  );
  process.exit(1);
}
if (!targetUrl || !targetToken) {
  console.error(
    "缺少当前项目数据库凭据：请设置 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN，或准备 .env.production.local",
  );
  process.exit(1);
}

const source = createClient({ url: sourceUrl, authToken: sourceToken });
const target = createClient({ url: targetUrl, authToken: targetToken });

async function main() {
  await target.execute(`CREATE TABLE IF NOT EXISTS resume_templates (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'general',
    tags text NOT NULL DEFAULT '',
    preview_url text NOT NULL,
    preview_key text NOT NULL DEFAULT '',
    file_url text NOT NULL,
    file_key text NOT NULL DEFAULT '',
    file_name text NOT NULL,
    file_size integer,
    file_mime text NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    is_free integer NOT NULL DEFAULT 1,
    price_points integer NOT NULL DEFAULT 0,
    price_fen integer NOT NULL DEFAULT 0,
    heat integer NOT NULL DEFAULT 0,
    sort integer NOT NULL DEFAULT 0,
    status integer NOT NULL DEFAULT 1,
    username text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
  )`);

  const result = await source.execute(
    "select * from resume_templates order by id",
  );
  let synced = 0;
  for (const row of result.rows) {
    await target.execute({
      sql: `INSERT INTO resume_templates
        (id,name,description,category,tags,preview_url,preview_key,file_url,file_key,file_name,file_size,file_mime,is_free,price_points,price_fen,heat,sort,status,username,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          description=excluded.description,
          category=excluded.category,
          tags=excluded.tags,
          preview_url=excluded.preview_url,
          preview_key=excluded.preview_key,
          file_url=excluded.file_url,
          file_key=excluded.file_key,
          file_name=excluded.file_name,
          file_size=excluded.file_size,
          file_mime=excluded.file_mime,
          is_free=1,
          price_points=0,
          price_fen=0,
          heat=excluded.heat,
          sort=excluded.sort,
          status=excluded.status,
          username=excluded.username,
          updated_at=excluded.updated_at`,
      args: [
        row.id,
        row.name,
        row.description ?? null,
        row.category ?? "general",
        row.tags ?? "",
        row.preview_url ?? "",
        row.preview_key ?? "",
        row.file_url,
        row.file_key ?? "",
        row.file_name,
        row.file_size ?? null,
        row.file_mime ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        1,
        0,
        0,
        Number(row.heat || 0),
        Number(row.sort || 0),
        Number(row.status ?? 1),
        row.username ?? null,
        Number(row.created_at || Date.now()),
        Date.now(),
      ],
    });
    synced += 1;
  }

  // Hide templates that were removed or unpublished at the source.
  const ids = result.rows
    .filter((row) => Number(row.status) === 1)
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id));
  if (ids.length) {
    await target.execute({
      sql: `UPDATE resume_templates
        SET status = 0, updated_at = ?
        WHERE status = 1 AND id NOT IN (${ids.map(() => "?").join(",")})`,
      args: [Date.now(), ...ids],
    });
  }

  console.log(`模板同步完成：${synced} 条，全部设为免费。`);
}

main().catch((error) => {
  console.error("模板同步失败：", error);
  process.exit(1);
});