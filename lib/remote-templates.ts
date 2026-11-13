import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type ServerTemplate = {
  id: number;
  name: string;
  title: string;
  key: string;
  description: string;
  category: string;
  categoryName: string;
  tags: string[];
  previewUrl: string;
  cover: string;
  previewUrls: string[];
  fileSize: number;
  fileMime: string;
  fileName?: string;
  isFree: boolean;
  price: number;
  priceText: string;
  priceFen: number;
  heat: number;
  downloadCount: number;
  sort: number;
  createdAt: number;
  updatedAt: number;
};

const CATEGORY_NAMES: Record<string, string> = {
  general: "通用",
  resume: "求职简历",
  course_ppt: "课程汇报",
  defense: "答辩",
  tech: "技术",
  design: "设计",
  finance: "财务",
  management: "管理",
  medical: "医疗",
  business: "商务",
};

export class RemoteTemplateError extends Error {
  code: "REMOTE_UNAVAILABLE" | "NOT_FOUND" | "DOWNLOAD_FORBIDDEN";

  constructor(code: RemoteTemplateError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function priceText(fen: number): string {
  return (fen / 100).toFixed(2).replace(/\.?0+$/, "");
}

function normalizeCategory(raw: string): string {
  const value = (raw || "").trim().toLowerCase();
  if (["resume", "course_ppt", "defense"].includes(value)) return value;
  return value || "general";
}

function toServerTemplate(row: {
  id: number;
  name: string;
  description: string | null;
  category: string;
  tags: string;
  previewUrl: string;
  fileSize: number | null;
  fileMime: string;
  fileName?: string | null;
  isFree: number;
  priceFen: number;
  heat: number;
  sort: number;
  createdAt: number;
  updatedAt: number;
}): ServerTemplate {
  const previewUrl = row.previewUrl || "";
  const priceFen = Number(row.priceFen) || 0;
  const isFree = row.isFree === 1 && priceFen === 0;
  return {
    id: Number(row.id),
    name: row.name,
    title: row.name,
    key: `rt_${row.id}`,
    description: row.description || "",
    category: normalizeCategory(row.category),
    categoryName: CATEGORY_NAMES[row.category] || CATEGORY_NAMES[normalizeCategory(row.category)] || "其他",
    tags: (row.tags || "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    previewUrl,
    cover: previewUrl,
    previewUrls: previewUrl ? [previewUrl] : [],
    fileSize: Number(row.fileSize || 0),
    fileMime: row.fileMime,
    fileName: row.fileName || undefined,
    isFree,
    price: priceFen,
    priceText: priceText(priceFen),
    priceFen,
    heat: Number(row.heat || 0),
    downloadCount: Number(row.heat || 0),
    sort: Number(row.sort || 0),
    createdAt: Number(row.createdAt || 0),
    updatedAt: Number(row.updatedAt || 0),
  };
}

const CARD_COLUMNS = {
  id: schema.resumeTemplates.id,
  name: schema.resumeTemplates.name,
  description: schema.resumeTemplates.description,
  category: schema.resumeTemplates.category,
  tags: schema.resumeTemplates.tags,
  previewUrl: schema.resumeTemplates.previewUrl,
  fileSize: schema.resumeTemplates.fileSize,
  fileMime: schema.resumeTemplates.fileMime,
  isFree: schema.resumeTemplates.isFree,
  priceFen: schema.resumeTemplates.priceFen,
  heat: schema.resumeTemplates.heat,
  sort: schema.resumeTemplates.sort,
  status: schema.resumeTemplates.status,
  createdAt: schema.resumeTemplates.createdAt,
  updatedAt: schema.resumeTemplates.updatedAt,
};

export async function listServerTemplates(options?: {
  q?: string;
  category?: string;
  sort?: "recommended" | "popular" | "latest";
}): Promise<{ templates: ServerTemplate[]; total: number }> {
  const db = await getDb();
  const filters: SQL[] = [eq(schema.resumeTemplates.status, 1)];
  if (options?.q) {
    const keyword = `%${options.q}%`;
    filters.push(
      or(
        like(schema.resumeTemplates.name, keyword),
        like(schema.resumeTemplates.description, keyword),
        like(schema.resumeTemplates.tags, keyword),
      )!,
    );
  }
  if (options?.category && options.category !== "全部") {
    filters.push(eq(schema.resumeTemplates.category, normalizeCategory(options.category)));
  }
  const where = and(...filters);
  const order =
    options?.sort === "popular"
      ? desc(schema.resumeTemplates.heat)
      : options?.sort === "latest"
        ? desc(schema.resumeTemplates.createdAt)
        : desc(schema.resumeTemplates.sort);

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.resumeTemplates)
    .where(where);
  const rows = await db
    .select(CARD_COLUMNS)
    .from(schema.resumeTemplates)
    .where(where)
    .orderBy(order, desc(schema.resumeTemplates.createdAt));
  return {
    templates: rows.map(toServerTemplate),
    total: Number(totalRows[0]?.count || rows.length),
  };
}

export async function getServerTemplate(id: number): Promise<ServerTemplate> {
  const db = await getDb();
  const rows = await db
    .select({ ...CARD_COLUMNS, fileName: schema.resumeTemplates.fileName })
    .from(schema.resumeTemplates)
    .where(and(eq(schema.resumeTemplates.id, id), eq(schema.resumeTemplates.status, 1)))
    .limit(1);
  if (!rows[0]) {
    throw new RemoteTemplateError("NOT_FOUND", "模板不存在或已下架");
  }
  return toServerTemplate(rows[0]);
}

export async function getServerTemplateFile(id: number): Promise<{
  id: number;
  fileUrl: string;
  fileName: string;
  fileMime: string;
  isFree: number;
  priceFen: number;
} | null> {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.resumeTemplates.id,
      fileUrl: schema.resumeTemplates.fileUrl,
      fileName: schema.resumeTemplates.fileName,
      fileMime: schema.resumeTemplates.fileMime,
      isFree: schema.resumeTemplates.isFree,
      priceFen: schema.resumeTemplates.priceFen,
    })
    .from(schema.resumeTemplates)
    .where(and(eq(schema.resumeTemplates.id, id), eq(schema.resumeTemplates.status, 1)))
    .limit(1);
  return rows[0] || null;
}

export async function bumpServerTemplateHeat(id: number): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.resumeTemplates)
    .set({ heat: sql`${schema.resumeTemplates.heat} + 1`, updatedAt: Date.now() })
    .where(and(eq(schema.resumeTemplates.id, id), eq(schema.resumeTemplates.status, 1)));
}

export async function downloadServerTemplate(id: number): Promise<Response> {
  const file = await getServerTemplateFile(id);
  if (!file) {
    throw new RemoteTemplateError("NOT_FOUND", "模板不存在或已下架");
  }
  try {
    const response = await fetch(file.fileUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok || !response.body) {
      throw new RemoteTemplateError(
        "REMOTE_UNAVAILABLE",
        "模板文件暂时无法从 R2 获取，请稍后重试",
      );
    }
    await bumpServerTemplateHeat(id).catch(() => undefined);
    return response;
  } catch (error) {
    if (error instanceof RemoteTemplateError) throw error;
    throw new RemoteTemplateError("REMOTE_UNAVAILABLE", "模板文件暂时无法从 R2 获取");
  }
}

export function serverTemplateCategories(templates: ServerTemplate[]): string[] {
  return ["全部", ...Array.from(new Set(templates.map((template) => CATEGORY_NAMES[template.category] || template.category)))];
}

export function categorySlugFromLabel(
  templates: ServerTemplate[],
  label: string,
): string | undefined {
  if (!label || label === "全部") return undefined;
  return templates.find((template) => (CATEGORY_NAMES[template.category] || template.category) === label)?.category;
}