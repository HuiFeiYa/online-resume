import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { parseTheme, type TemplateTheme } from "@/lib/resume/schema";

export const SUPPORTED_TEMPLATES = [
  {
    id: "tpl-001",
    slug: "forest-editorial",
    title: "松林双栏",
    description: "左侧个人信息与技能，右侧经历主线。适合产品、运营、市场与综合岗位。",
    category: "通用",
    tags: ["双栏", "稳重", "应届可用"],
    rendererKey: "sidebar",
    themeJson: JSON.stringify({ accent: "#3f6b5a", pale: "#edf3ef", sidebar: true, serif: true }),
    sort: 100,
  },
  {
    id: "tpl-002",
    slug: "cinnabar-classic",
    title: "朱砂单栏",
    description: "正式、克制的一页式布局，适合行政、财务、教育与传统行业。",
    category: "正式",
    tags: ["单栏", "正式", "通用"],
    rendererKey: "classic",
    themeJson: JSON.stringify({ accent: "#9b3b30", pale: "#f7efeb", sidebar: false, serif: true }),
    sort: 99,
  },
  {
    id: "tpl-003",
    slug: "internet-minimal",
    title: "互联网极简",
    description: "项目与技能优先，信息密度适中，适合互联网和科技岗位。",
    category: "互联网",
    tags: ["极简", "科技", "项目导向"],
    rendererKey: "minimal",
    themeJson: JSON.stringify({ accent: "#2f6076", pale: "#edf3f6", sidebar: false, serif: false }),
    sort: 98,
  },
  {
    id: "tpl-004",
    slug: "simple-ats",
    title: "ATS 简洁版",
    description: "无照片、无装饰，强调机器可读、结构清楚和信息完整。",
    category: "正式",
    tags: ["ATS", "简洁", "通用"],
    rendererKey: "ats",
    themeJson: JSON.stringify({ accent: "#343b38", pale: "#f3f4f3", sidebar: false, serif: false }),
    sort: 97,
  },
  {
    id: "tpl-tech-timeline",
    slug: "tech-timeline",
    title: "技术时间线",
    description: "时间轴突出工作履历连续性和技术成长路径，适合开发、测试与运维。",
    category: "技术",
    tags: ["时间线", "技术", "履历"],
    rendererKey: "timeline",
    themeJson: JSON.stringify({ accent: "#2b6a7a", pale: "#edf4f5", sidebar: false, serif: false }),
    sort: 96,
  },
  {
    id: "tpl-banded-section",
    slug: "banded-section",
    title: "灰块分区版",
    description: "灰底模块标题和信息分区，适合国企、传统行业及通用投递。",
    category: "正式",
    tags: ["分区", "灰块", "通用"],
    rendererKey: "banded",
    themeJson: JSON.stringify({ accent: "#525252", pale: "#f0f0f0", sidebar: false, serif: false }),
    sort: 95,
  },
  {
    id: "tpl-blue-accent",
    slug: "blue-accent",
    title: "蓝色重点版",
    description: "蓝色标题与技能标签，突出专业能力和个人荣誉。",
    category: "技术",
    tags: ["蓝色", "重点", "技能"],
    rendererKey: "blue",
    themeJson: JSON.stringify({ accent: "#245c9e", pale: "#eef4fb", sidebar: false, serif: false }),
    sort: 94,
  },
  {
    id: "tpl-compact-one-page",
    slug: "compact-one-page",
    title: "紧凑一页版",
    description: "更紧凑的间距和更高的信息密度，适合经历较多的职场人。",
    category: "通用",
    tags: ["一页", "紧凑", "高密度"],
    rendererKey: "compact",
    themeJson: JSON.stringify({ accent: "#47634f", pale: "#eef3ef", sidebar: true, serif: false }),
    sort: 93,
  },
] as const;

const SUPPORTED_SLUGS = SUPPORTED_TEMPLATES.map((item) => item.slug);

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

export async function ensureTemplates(): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  for (const [index, item] of SUPPORTED_TEMPLATES.entries()) {
    const existing = await db
      .select({ id: schema.templateItems.id, themeJson: schema.templateItems.themeJson })
      .from(schema.templateItems)
      .where(eq(schema.templateItems.slug, item.slug))
      .limit(1);

    if (existing.length) {
      await db
        .update(schema.templateItems)
        .set({
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags.join(","),
          previewUrl: "",
          rendererKey: item.rendererKey,
          themeJson: item.themeJson,
          editorEnabled: 1,
          sort: item.sort,
          updatedAt: now,
        })
        .where(eq(schema.templateItems.id, existing[0].id));
      continue;
    }

    await db.insert(schema.templateItems).values({
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags.join(","),
      previewUrl: "",
      docxKey: null,
      sourceId: null,
      rendererKey: item.rendererKey,
      themeJson: item.themeJson,
      editorEnabled: 1,
      downloadCount: Math.max(0, 386 - index * 32),
      sort: item.sort,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Earlier versions imported the whole legacy catalog even though only these
  // layouts can be rendered faithfully. Hide unsupported entries instead of
  // showing a preview that leads to a different editor theme.
  await db
    .update(schema.templateItems)
    .set({ editorEnabled: 0, updatedAt: now })
    .where(
      and(
        sql`${schema.templateItems.slug} NOT IN (${sql.join(
          SUPPORTED_SLUGS.map((slug) => sql`${slug}`),
          sql`, `,
        )})`,
        eq(schema.templateItems.editorEnabled, 1),
      ),
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
  const filters: SQL[] = [eq(schema.templateItems.editorEnabled, 1)];
  if (q) {
    filters.push(
      or(
        like(schema.templateItems.title, `%${q}%`),
        like(schema.templateItems.description, `%${q}%`),
        like(schema.templateItems.tags, `%${q}%`),
      )!,
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
    .where(and(eq(schema.templateItems.slug, slug), eq(schema.templateItems.editorEnabled, 1)))
    .limit(1);
  return rows[0] ? toTemplate(rows[0]) : null;
}

export async function getTemplateById(id: string): Promise<TemplateItem | null> {
  await ensureTemplates();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.templateItems)
    .where(and(eq(schema.templateItems.id, id), eq(schema.templateItems.editorEnabled, 1)))
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