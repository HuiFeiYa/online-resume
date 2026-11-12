import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// drizzle-kit 在 Node 中运行；本地默认连 local.db，配置了 TURSO_DATABASE_URL 则连 Turso 远端。
dotenv.config({ path: ".env.local" });

const isLocalDev = !process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  ...(isLocalDev
    ? {
        dbCredentials: {
          url: "file:./local.db",
        },
      }
    : {
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }),
});
