import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { tursoFetch } from "@/lib/turso-client";

export { schema };

/**
 * Runtime supports both better-sqlite3 and libsql. Their query builders have
 * identical surface for the operations used here; keep one public type so
 * TypeScript does not collapse `.select()` into an uncallable union overload.
 */
export type DB = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  __resume_site_db?: DB;
};

/**
 * 轻量运行时建表。正式迁移可在 scripts 中执行，但首次启动也能直接跑通。
 * 所有语句都是幂等的，避免本地开发依赖额外步骤。
 */
async function ensureSchema(db: DB): Promise<void> {
  const run = (query: ReturnType<typeof sql>) => (db as any).run(query);
  const all = async (query: ReturnType<typeof sql>): Promise<any[]> => {
    const result = await (db as any).all(query);
    return Array.isArray(result) ? result : [];
  };

  await run(
    sql`CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user',
      is_vip integer NOT NULL DEFAULT 0,
      vip_expires_at integer,
      created_at integer NOT NULL
    )`,
  );

  // Preserve accounts created by the earlier email-based version of this app.
  const columns = await all(sql`PRAGMA table_info(users)`);
  const hasUsername = columns.some((column) => column.name === "username");
  if (!hasUsername) {
    // A previous interrupted migration may have left this staging table behind.
    // It is never the source of truth; `users` still holds every account.
    await run(sql`DROP TABLE IF EXISTS users_next`);
    await run(
      sql`CREATE TABLE users_next (
        id text PRIMARY KEY NOT NULL,
        username text NOT NULL,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        created_at integer NOT NULL
      )`,
    );
    await run(
      sql`WITH ranked AS (
        SELECT
          id,
          COALESCE(NULLIF(trim(display_name), ''), email) AS base_name,
          password_hash,
          role,
          created_at,
          row_number() OVER (
            PARTITION BY lower(COALESCE(NULLIF(trim(display_name), ''), email))
            ORDER BY created_at, id
          ) AS rn
        FROM users
      )
      INSERT INTO users_next (id, username, password_hash, role, created_at)
      SELECT
        id,
        CASE
          WHEN rn = 1 THEN base_name
          ELSE base_name || '-' || substr(id, -4)
        END,
        password_hash,
        role,
        created_at
      FROM ranked`,
    );
    await run(sql`DROP TABLE users`);
    await run(sql`ALTER TABLE users_next RENAME TO users`);
  }
  await run(sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)`);
  const userColumns = await all(sql`PRAGMA table_info(users)`);
  if (!userColumns.some((column) => column.name === "is_vip")) {
    await run(sql`ALTER TABLE users ADD COLUMN is_vip integer NOT NULL DEFAULT 0`);
  }
  if (!userColumns.some((column) => column.name === "vip_expires_at")) {
    await run(sql`ALTER TABLE users ADD COLUMN vip_expires_at integer`);
  }
  await run(
    sql`CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value text NOT NULL DEFAULT '',
      updated_at integer NOT NULL DEFAULT 0
    )`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS template_items (
      id text PRIMARY KEY NOT NULL,
      slug text NOT NULL,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      category text NOT NULL DEFAULT 'general',
      tags text NOT NULL DEFAULT '',
      preview_url text NOT NULL DEFAULT '',
      docx_key text,
      source_id integer,
      renderer_key text NOT NULL DEFAULT 'classic',
      theme_json text NOT NULL DEFAULT '{}',
      editor_enabled integer NOT NULL DEFAULT 1,
      download_count integer NOT NULL DEFAULT 0,
      sort integer NOT NULL DEFAULT 0,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS template_items_slug_unique ON template_items (slug)`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS saved_templates (
      user_id text NOT NULL,
      template_id text NOT NULL,
      created_at integer NOT NULL,
      PRIMARY KEY (user_id, template_id)
    )`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS resumes (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      template_id text NOT NULL,
      title text NOT NULL DEFAULT '我的简历',
      data_json text NOT NULL,
      revision integer NOT NULL DEFAULT 1,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
  );
  await run(sql`CREATE INDEX IF NOT EXISTS resumes_user_idx ON resumes (user_id)`);
  await run(
    sql`CREATE TABLE IF NOT EXISTS resume_versions (
      id text PRIMARY KEY NOT NULL,
      resume_id text NOT NULL,
      data_json text NOT NULL,
      label text NOT NULL DEFAULT '自动保存',
      created_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS analysis_jobs (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      kind text NOT NULL,
      status text NOT NULL DEFAULT 'completed',
      file_name text NOT NULL DEFAULT '',
      file_key text,
      extracted_text text,
      jd_text text,
      result_json text,
      score integer,
      model text NOT NULL DEFAULT 'local-heuristic',
      created_at integer NOT NULL,
      expires_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE INDEX IF NOT EXISTS analysis_jobs_user_idx ON analysis_jobs (user_id, created_at)`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS optimized_resumes (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      analysis_id text NOT NULL,
      source_resume_id text,
      title text NOT NULL DEFAULT '优化版简历',
      data_json text NOT NULL,
      changes_json text NOT NULL DEFAULT '[]',
      model text NOT NULL DEFAULT '',
      created_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE INDEX IF NOT EXISTS optimized_resumes_user_idx ON optimized_resumes (user_id, created_at)`,
  );
  await run(
    sql`CREATE INDEX IF NOT EXISTS optimized_resumes_analysis_idx ON optimized_resumes (analysis_id)`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS consultation_leads (
      id text PRIMARY KEY NOT NULL,
      user_id text,
      name text NOT NULL,
      contact_type text NOT NULL DEFAULT 'wechat',
      contact_value text NOT NULL,
      target_role text NOT NULL DEFAULT '',
      message text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'new',
      created_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS usage_counters (
      id text PRIMARY KEY NOT NULL,
      subject_hash text NOT NULL,
      action text NOT NULL,
      window_start integer NOT NULL,
      count integer NOT NULL DEFAULT 0
    )`,
  );
  await run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS usage_counters_unique ON usage_counters (subject_hash, action, window_start)`,
  );
  await run(
    sql`CREATE TABLE IF NOT EXISTS download_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      template_id text NOT NULL,
      user_hash text NOT NULL DEFAULT '',
      created_at integer NOT NULL
    )`,
  );

  // Remote/downloadable resume templates migrated from the template-store backend.
  await run(
    sql`CREATE TABLE IF NOT EXISTS resume_templates (
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
    )`,
  );
  await run(sql`CREATE INDEX IF NOT EXISTS resume_tpl_status_idx ON resume_templates (status, sort)`);
  await run(sql`CREATE INDEX IF NOT EXISTS resume_tpl_category_idx ON resume_templates (category)`);
  await run(
    sql`CREATE TABLE IF NOT EXISTS resume_template_grants (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      username text NOT NULL,
      open_id text NOT NULL DEFAULT '',
      template_id integer NOT NULL,
      out_trade_no text NOT NULL DEFAULT '',
      created_at integer NOT NULL
    )`,
  );
  await run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_resume_tpl_grants_user_tpl ON resume_template_grants (username, template_id)`,
  );
  await run(
    sql`CREATE INDEX IF NOT EXISTS resume_tpl_grants_username_idx ON resume_template_grants (username)`,
  );
  await run(
    sql`CREATE INDEX IF NOT EXISTS resume_tpl_grants_template_idx ON resume_template_grants (template_id)`,
  );
}

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;
let schemaFailedAt = 0;
const SCHEMA_RETRY_MS = 60_000;

function ensureSchemaOnce(db: DB): Promise<void> {
  if (schemaEnsured) return Promise.resolve();
  if (schemaPromise) return schemaPromise;
  if (schemaFailedAt && Date.now() - schemaFailedAt < SCHEMA_RETRY_MS) {
    return Promise.resolve();
  }
  schemaPromise = ensureSchema(db)
    .then(() => {
      schemaEnsured = true;
    })
    .catch((err) => {
      schemaFailedAt = Date.now();
      console.error("[db] ensureSchema 失败（可忽略若表已存在）", err);
    })
    .finally(() => {
      schemaPromise = null;
    });
  return schemaPromise;
}

export async function getDb(): Promise<DB> {
  if (globalForDb.__resume_site_db) {
    await ensureSchemaOnce(globalForDb.__resume_site_db);
    return globalForDb.__resume_site_db;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  let db: DB;

  if (tursoUrl) {
    const { createClient } = await import("@libsql/client");
    const { drizzle: drizzleLibsql } = await import("drizzle-orm/libsql");
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
      fetch: tursoFetch as any,
    });
    db = drizzleLibsql(client, { schema }) as unknown as DB;
  } else {
    const Database = (await import("better-sqlite3")).default;
    const { drizzle: drizzleBetter } = await import("drizzle-orm/better-sqlite3");
    const sqlite = new Database("./local.db");
    sqlite.pragma("journal_mode = WAL");
    db = drizzleBetter(sqlite, { schema });
  }

  globalForDb.__resume_site_db = db;
  await ensureSchemaOnce(db);
  return db;
}