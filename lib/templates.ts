import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { parseTheme, type TemplateTheme } from "@/lib/resume/schema";

export type TemplateItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  previewUrl: string;
  rendererKey: string;
  theme: TemplateTheme;
  editorEnabled: boolean;
  downloadCount: number;
  sort: number;
};

const seedTemplates = [
  {
    slug: "forest-editorial",
    title: "松林编辑式",
    description: "适合产品、运营与市场岗位。左侧信息栏，阅读路径清晰，打印友好。",
    category: "通用",
    tags: ["双栏", "稳重", "应届可用"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv0j7lxs-lvfsdy90/preview.jpg",
    rendererKey: "sidebar",
    themeJson: JSON.stringify({ accent: "#3f6b5a", pale: "#edf3ef", sidebar: true, serif: true }),
    editorEnabled: 1,
    sort: 100,
  },
  {
    slug: "cinnabar-classic",
    title: "朱砂经典单栏",
    description: "正式、克制的一页式简历，适合行政、财务、教育及传统行业。",
    category: "通用",
    tags: ["单栏", "正式", "ATS 友好"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tmce6-furwc8e7/preview.jpg",
    rendererKey: "classic",
    themeJson: JSON.stringify({ accent: "#9b3b30", pale: "#f7efeb", sidebar: false, serif: true }),
    editorEnabled: 1,
    sort: 99,
  },
  {
    slug: "internet-minimal",
    title: "互联网极简",
    description: "信息密度适中，突出经历结果与技能栈，适合互联网和科技公司。",
    category: "互联网",
    tags: ["极简", "科技", "项目导向"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1z8mtd-1y3aqvj6/preview.jpg",
    rendererKey: "minimal",
    themeJson: JSON.stringify({ accent: "#2f6076", pale: "#edf3f6", sidebar: false, serif: false }),
    editorEnabled: 1,
    sort: 98,
  },
  {
    slug: "graduate-fresh",
    title: "应届生清新版",
    description: "为校招设计，突出教育背景、项目经历和校园实践。",
    category: "应届生",
    tags: ["校招", "清新", "教育优先"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tlg0q-4ebkb8k7/preview.jpg",
    rendererKey: "sidebar",
    themeJson: JSON.stringify({ accent: "#5c7354", pale: "#f0f4ec", sidebar: true, serif: true }),
    editorEnabled: 1,
    sort: 97,
  },
  {
    slug: "product-manager",
    title: "产品经理聚焦版",
    description: "把项目、指标和业务结果放到视觉中心，适合产品与运营岗位。",
    category: "互联网",
    tags: ["产品", "运营", "结果导向"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv2385uy-q7qso6xx/preview.jpg",
    rendererKey: "minimal",
    themeJson: JSON.stringify({ accent: "#5a5f7a", pale: "#f0f1f6", sidebar: false, serif: false }),
    editorEnabled: 1,
    sort: 96,
  },
  {
    slug: "finance-professional",
    title: "财务专业版",
    description: "严谨的单栏结构，突出证书、专业能力与合规经验。",
    category: "财务",
    tags: ["财务", "证书", "单栏"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv22qegx-7hcq35nf/preview.jpg",
    rendererKey: "classic",
    themeJson: JSON.stringify({ accent: "#86672c", pale: "#f7f2e7", sidebar: false, serif: true }),
    editorEnabled: 1,
    sort: 95,
  },
  {
    slug: "admin-structure",
    title: "行政管理结构版",
    description: "模块边界明确，适合行政、人事和综合管理岗位。",
    category: "通用",
    tags: ["行政", "人事", "结构清晰"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1z9ma0-o14d5xxy/preview.jpg",
    rendererKey: "classic",
    themeJson: JSON.stringify({ accent: "#616d62", pale: "#f1f3f0", sidebar: false, serif: false }),
    editorEnabled: 1,
    sort: 94,
  },
  {
    slug: "design-portfolio",
    title: "创意作品集版",
    description: "更活泼的标题层级，适合设计、品牌、新媒体岗位。",
    category: "设计",
    tags: ["设计", "创意", "作品集"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tolof-ur9na0m3/preview.jpg",
    rendererKey: "sidebar",
    themeJson: JSON.stringify({ accent: "#9a4d43", pale: "#f8efec", sidebar: true, serif: false }),
    editorEnabled: 1,
    sort: 93,
  },
  {
    slug: "project-lead",
    title: "项目负责人版",
    description: "强调跨团队协作、项目周期、预算与交付结果。",
    category: "管理",
    tags: ["项目管理", "负责人", "成果"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tnk6t-myr3h7yn/preview.jpg",
    rendererKey: "minimal",
    themeJson: JSON.stringify({ accent: "#4e6170", pale: "#eef2f4", sidebar: false, serif: false }),
    editorEnabled: 1,
    sort: 92,
  },
  {
    slug: "nurse-care",
    title: "医护专业版",
    description: "突出执业资格、临床经历和专业技能，适合医疗健康岗位。",
    category: "医疗",
    tags: ["医护", "资格证", "专业"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1to1gz-mhtogx3w/preview.jpg",
    rendererKey: "classic",
    themeJson: JSON.stringify({ accent: "#3c7281", pale: "#edf5f6", sidebar: false, serif: true }),
    editorEnabled: 1,
    sort: 91,
  },
  {
    slug: "trade-global",
    title: "外贸商务版",
    description: "突出语言能力、客户开发和跨境业务成果。",
    category: "商务",
    tags: ["外贸", "语言", "客户开发"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tp3xu-0of0qzi1/preview.jpg",
    rendererKey: "sidebar",
    themeJson: JSON.stringify({ accent: "#426b65", pale: "#eff4f3", sidebar: true, serif: true }),
    editorEnabled: 1,
    sort: 90,
  },
  {
    slug: "simple-ats",
    title: "ATS 简洁版",
    description: "无照片、无装饰，优先保证机器可读与内容完整。",
    category: "通用",
    tags: ["ATS", "简洁", "通用"],
    previewUrl:
      "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/resume-templates/mv1tku28-hdcijp2i/preview.jpg",
    rendererKey: "ats",
    themeJson: JSON.stringify({ accent: "#343b38", pale: "#f3f4f3", sidebar: false, serif: false }),
    editorEnabled: 1,
    sort: 89,
  },
];

export async function ensureTemplates(): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: schema.templateItems.id }).from(schema.templateItems).limit(1);
  if (existing.length) return;
  const now = Date.now();
  await db.insert(schema.templateItems).values(
    seedTemplates.map((item, index) => ({
      id: `tpl-${String(index + 1).padStart(3, "0")}`,
      slug: item.slug,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags.join(","),
      previewUrl: item.previewUrl,
      docxKey: null,
      sourceId: null,
      rendererKey: item.rendererKey,
      themeJson: item.themeJson,
      editorEnabled: item.editorEnabled,
      downloadCount: Math.max(0, 386 - index * 24),
      sort: item.sort,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

function toTemplate(row: typeof schema.templateItems.$inferSelect): TemplateItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    previewUrl: row.previewUrl,
    rendererKey: row.rendererKey,
    theme: parseTheme(row.themeJson),
    editorEnabled: row.editorEnabled === 1,
    downloadCount: row.downloadCount,
    sort: row.sort,
  };
}

export async function listTemplates(options?: {
  q?: string;
  category?: string;
  sort?: "recommended" | "popular" | "latest";
}): Promise<TemplateItem[]> {
  await ensureTemplates();
  const db = await getDb();
  const q = options?.q?.trim();
  const category = options?.category?.trim();
  const filters = [];
  if (q) {
    filters.push(
      or(
        like(schema.templateItems.title, `%${q}%`),
        like(schema.templateItems.description, `%${q}%`),
        like(schema.templateItems.tags, `%${q}%`),
      ),
    );
  }
  if (category && category !== "全部") {
    filters.push(eq(schema.templateItems.category, category));
  }
  const where = filters.length ? and(...filters) : undefined;
  const order =
    options?.sort === "popular"
      ? desc(schema.templateItems.downloadCount)
      : options?.sort === "latest"
        ? desc(schema.templateItems.createdAt)
        : asc(schema.templateItems.sort);
  const rows = await db.select().from(schema.templateItems).where(where).orderBy(order);
  return rows.map(toTemplate);
}

export async function getTemplateBySlug(slug: string): Promise<TemplateItem | null> {
  await ensureTemplates();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.templateItems)
    .where(eq(schema.templateItems.slug, slug))
    .limit(1);
  return rows[0] ? toTemplate(rows[0]) : null;
}

export async function getTemplateById(id: string): Promise<TemplateItem | null> {
  await ensureTemplates();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.templateItems)
    .where(eq(schema.templateItems.id, id))
    .limit(1);
  return rows[0] ? toTemplate(rows[0]) : null;
}

export async function incrementTemplateDownload(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.templateItems)
    .set({ downloadCount: sql`${schema.templateItems.downloadCount} + 1` })
    .where(eq(schema.templateItems.id, id));
}

export function templateCategories(items: TemplateItem[]): string[] {
  return ["全部", ...Array.from(new Set(items.map((item) => item.category)))];
}