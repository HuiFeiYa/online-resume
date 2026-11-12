import { z } from "zod";

const dateText = z
  .string()
  .trim()
  .max(20, "日期过长")
  .optional()
  .or(z.literal(""));

export const educationSchema = z.object({
  id: z.string(),
  school: z.string().trim().max(100),
  degree: z.string().trim().max(50),
  major: z.string().trim().max(100),
  startDate: dateText,
  endDate: dateText,
  highlights: z.array(z.string().trim().max(500)).max(8),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().trim().max(100),
  role: z.string().trim().max(100),
  location: z.string().trim().max(50).optional().or(z.literal("")),
  startDate: dateText,
  endDate: dateText,
  bullets: z.array(z.string().trim().max(500)).max(12),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().trim().max(100),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  tech: z.array(z.string().trim().max(40)).max(15),
  startDate: dateText,
  endDate: dateText,
  bullets: z.array(z.string().trim().max(500)).max(10),
});

export const skillGroupSchema = z.object({
  id: z.string(),
  category: z.string().trim().max(30),
  items: z.array(z.string().trim().max(40)).max(20),
});

export const customSectionSchema = z.object({
  id: z.string(),
  title: z.string().trim().max(50),
  bullets: z.array(z.string().trim().max(500)).max(12),
});

export const sectionVisibilitySchema = z.object({
  education: z.boolean().default(true),
  certificates: z.boolean().default(true),
  languages: z.boolean().default(true),
  skills: z.boolean().default(true),
  experience: z.boolean().default(true),
  projects: z.boolean().default(true),
  evaluation: z.boolean().default(true),
  custom: z.boolean().default(true),
});

export type SectionVisibility = z.infer<typeof sectionVisibilitySchema>;
export type SectionKey = keyof SectionVisibility;

export const defaultSectionVisibility: SectionVisibility = {
  education: true,
  certificates: true,
  languages: true,
  skills: true,
  experience: true,
  projects: true,
  evaluation: true,
  custom: true,
};

export const resumeDataSchema = z.object({
  basics: z.object({
    name: z.string().trim().max(50).default(""),
    jobTitle: z.string().trim().max(60).default(""),
    gender: z.string().trim().max(20).default(""),
    birthDate: z.string().trim().max(30).default(""),
    yearsExperience: z.string().trim().max(30).default(""),
    phone: z.string().trim().max(30).default(""),
    email: z.string().trim().max(100).default(""),
    school: z.string().trim().max(100).default(""),
    degree: z.string().trim().max(50).default(""),
    wechat: z.string().trim().max(50).optional().or(z.literal("")),
    city: z.string().trim().max(30).optional().or(z.literal("")),
    website: z.string().trim().max(120).optional().or(z.literal("")),
    photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
    // Legacy field: normalized into `evaluation` for existing records.
    summary: z.string().trim().max(1200).optional().or(z.literal("")),
  }),
  intention: z.object({
    targetRole: z.string().trim().max(60).optional().or(z.literal("")),
    targetCity: z.string().trim().max(30).optional().or(z.literal("")),
    salary: z.string().trim().max(30).optional().or(z.literal("")),
    availability: z.string().trim().max(30).optional().or(z.literal("")),
  }),
  evaluation: z.string().trim().max(1500).default(""),
  sectionVisibility: sectionVisibilitySchema.default(defaultSectionVisibility),
  education: z.array(educationSchema).max(8).default([]),
  experience: z.array(experienceSchema).max(12).default([]),
  projects: z.array(projectSchema).max(12).default([]),
  skills: z.array(skillGroupSchema).max(10).default([]),
  certificates: z.array(z.string().trim().max(100)).max(20).default([]),
  languages: z.array(z.string().trim().max(60)).max(10).default([]),
  customSections: z.array(customSectionSchema).max(6).default([]),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
export type TemplateTheme = {
  accent: string;
  pale: string;
  sidebar: boolean;
  serif: boolean;
};

export const defaultTheme: TemplateTheme = {
  accent: "#3f6b5a",
  pale: "#eef3ef",
  sidebar: true,
  serif: true,
};

export function parseTheme(json: string): TemplateTheme {
  try {
    const parsed = JSON.parse(json) as Partial<TemplateTheme>;
    return { ...defaultTheme, ...parsed };
  } catch {
    return defaultTheme;
  }
}

/** Normalize records and guest drafts written before the new section model. */
export function normalizeResumeData(input: unknown): ResumeData {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const basics = (raw.basics && typeof raw.basics === "object" ? raw.basics : {}) as Record<string, any>;
  const intention = (raw.intention && typeof raw.intention === "object" ? raw.intention : {}) as Record<string, any>;
  const education = Array.isArray(raw.education) ? raw.education : [];
  const firstEducation = education[0] || {};

  const normalized = {
    ...raw,
    basics: {
      name: "",
      jobTitle: "",
      gender: "",
      birthDate: "",
      yearsExperience: "",
      phone: "",
      email: "",
      school: String(firstEducation.school || ""),
      degree: String(firstEducation.degree || ""),
      wechat: "",
      city: "",
      website: "",
      photoUrl: "",
      ...basics,
    },
    intention: {
      targetRole: "",
      targetCity: "",
      salary: "",
      availability: "",
      ...intention,
    },
    evaluation:
      typeof raw.evaluation === "string" && raw.evaluation.trim()
        ? raw.evaluation
        : typeof basics.summary === "string"
          ? basics.summary
          : "",
    sectionVisibility: {
      ...defaultSectionVisibility,
      ...(raw.sectionVisibility && typeof raw.sectionVisibility === "object"
        ? raw.sectionVisibility
        : {}),
    },
    education,
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    certificates: Array.isArray(raw.certificates) ? raw.certificates : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
  };

  return resumeDataSchema.parse(normalized);
}

export function createEmptyResume(name = ""): ResumeData {
  return normalizeResumeData({
    basics: { name },
    intention: {},
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certificates: [],
    languages: [],
    customSections: [],
  });
}

export function createDemoResume(): ResumeData {
  return normalizeResumeData({
    basics: {
      name: "林知夏",
      jobTitle: "产品运营",
      gender: "女",
      birthDate: "1999.08",
      yearsExperience: "3 年",
      phone: "138 0000 1234",
      email: "zhixia@example.com",
      wechat: "zhixia_note",
      city: "上海",
      school: "华东理工大学",
      degree: "本科",
      website: "",
      photoUrl: "",
    },
    intention: {
      targetRole: "产品运营 / 用户增长",
      targetCity: "上海",
      salary: "面议",
      availability: "一个月内",
    },
    evaluation:
      "具备用户增长、活动运营和数据分析经验，能够从用户反馈与业务数据中定位问题。习惯用可量化结果复盘，推动跨团队协作落地。",
    sectionVisibility: defaultSectionVisibility,
    education: [
      {
        id: "edu-1",
        school: "华东理工大学",
        degree: "本科",
        major: "市场营销",
        startDate: "2018.09",
        endDate: "2022.06",
        highlights: ["校学生会新媒体负责人，策划 12 场校园活动", "校级一等奖学金 2 次"],
      },
    ],
    experience: [
      {
        id: "exp-1",
        company: "拾光科技",
        role: "产品运营",
        location: "上海",
        startDate: "2022.07",
        endDate: "至今",
        bullets: [
          "负责新用户承接链路，围绕注册、激活和首单设计 6 个运营触点，使 30 日留存提升 18%。",
          "搭建用户反馈标签体系，每月处理 300+ 条反馈，推动 8 个高频问题进入产品迭代。",
          "联合销售和客服落地季度活动，活动期间付费转化率提升 12%，回收成本周期缩短 10 天。",
        ],
      },
      {
        id: "exp-2",
        company: "原点工作室",
        role: "内容运营实习生",
        location: "杭州",
        startDate: "2021.07",
        endDate: "2022.01",
        bullets: [
          "运营品牌公众号和社群，3 个月内粉丝增长 1.2 万，平均打开率保持在 9%。",
          "整理竞品内容和选题数据，输出周报 20+ 份，为内容排期提供依据。",
        ],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "新用户成长体系",
        role: "项目负责人",
        tech: ["用户分层", "A/B 测试", "数据分析"],
        startDate: "2023.03",
        endDate: "2023.08",
        bullets: [
          "重构新手任务与激励规则，按用户来源和行为路径拆分 4 组实验。",
          "上线后新手任务完成率从 42% 提升至 61%，次月主动访问人数增长 25%。",
        ],
      },
    ],
    skills: [
      { id: "skill-1", category: "运营方法", items: ["用户增长", "活动策划", "社群运营", "A/B 测试"] },
      { id: "skill-2", category: "工具", items: ["SQL", "Tableau", "Figma", "飞书多维表格"] },
    ],
    certificates: ["大学英语六级（CET-6）", "全国计算机等级考试二级"],
    languages: ["中文（母语）", "英语（可商务沟通）"],
    customSections: [],
  });
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}