import { loadTursoEnvFromComments } from "../lib/load-turso-env";

// 从 .env.local 注释行中解析并注入 TURSO_ 变量，再执行迁移。
loadTursoEnvFromComments();

await import("../db/migrate");
