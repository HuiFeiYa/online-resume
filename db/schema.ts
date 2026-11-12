import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at").notNull().default(0),
});

export const templateItems = sqliteTable(
  "template_items",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("general"),
    tags: text("tags").notNull().default(""),
    previewUrl: text("preview_url").notNull().default(""),
    docxKey: text("docx_key"),
    sourceId: integer("source_id"),
    rendererKey: text("renderer_key").notNull().default("classic"),
    themeJson: text("theme_json").notNull().default("{}"),
    editorEnabled: integer("editor_enabled").notNull().default(1),
    downloadCount: integer("download_count").notNull().default(0),
    sort: integer("sort").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("template_items_slug_unique").on(table.slug)],
);

export const savedTemplates = sqliteTable(
  "saved_templates",
  {
    userId: text("user_id").notNull(),
    templateId: text("template_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.templateId] })],
);

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  templateId: text("template_id").notNull(),
  title: text("title").notNull().default("我的简历"),
  dataJson: text("data_json").notNull(),
  revision: integer("revision").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const resumeVersions = sqliteTable("resume_versions", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id").notNull(),
  dataJson: text("data_json").notNull(),
  label: text("label").notNull().default("自动保存"),
  createdAt: integer("created_at").notNull(),
});

export const analysisJobs = sqliteTable("analysis_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("completed"),
  fileName: text("file_name").notNull().default(""),
  fileKey: text("file_key"),
  extractedText: text("extracted_text"),
  jdText: text("jd_text"),
  resultJson: text("result_json"),
  score: integer("score"),
  model: text("model").notNull().default("local-heuristic"),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const consultationLeads = sqliteTable("consultation_leads", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  contactType: text("contact_type").notNull().default("wechat"),
  contactValue: text("contact_value").notNull(),
  targetRole: text("target_role").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: integer("created_at").notNull(),
});

export const usageCounters = sqliteTable("usage_counters", {
  id: text("id").primaryKey(),
  subjectHash: text("subject_hash").notNull(),
  action: text("action").notNull(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

export const downloadEvents = sqliteTable("download_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: text("template_id").notNull(),
  userHash: text("user_hash").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});