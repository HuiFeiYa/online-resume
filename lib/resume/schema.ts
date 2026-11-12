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

export const resumeDataSchema = z.object({
  basics: z.object({
    name: z.string().trim().max(50),
    jobTitle: z.string().trim().max(60),
    phone: z.string().trim().max(30),
    email: z.string().trim().max(100),
    wechat: z.string().trim().max(50).optional().or(z.literal("")),
    city: z.string().trim().max(30).optional().or(z.literal("")),
    website: z.string().trim().max(120).optional().or(z.literal("")),
    photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
    summary: z.string().trim().max(1200).optional().or(z.literal("")),
  }),
  intention: z.object({
    targetRole: z.string().trim().max(60).optional().or(z.literal("")),
    targetCity: z.string().trim().max(30).optional().or(z.literal("")),
    salary: z.string().trim().max(30).optional().or(z.literal("")),
    availability: z.string().trim().max(30).optional().or(z.literal("")),
  }),
  education: z.array(educationSchema).max(8),
  experience: z.array(experienceSchema).max(12),
  projects: z.array(projectSchema).max(12),
  skills: z.array(skillGroupSchema).max(10),
  certificates: z.array(z.string().trim().max(100)).max(20),
  languages: z.array(z.string().trim().max(60)).max(10),
  customSections: z.array(customSectionSchema).max(6),
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

export function createEmptyResume(name = ""): ResumeData {
  return {
    basics: {
      name,
      jobTitle: "",
      phone: "",
      email: "",
      wechat: "",
      city: "",
      website: "",
      photoUrl: "",
      summary: "",
    },
    intention: {
      targetRole: "",
      targetCity: "",
      salary: "",
      availability: "",
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certificates: [],
    languages: [],
    customSections: [],
  };
}

export function createDemoResume(): ResumeData {
  return {
    basics: {
      name: "林知夏",
      jobTitle: "产品运营",
      phone: "138 0000 1234",
      email: "zhixia@example.com",
      wechat: "zhixia_note",
      city: "上海",
      website: "",
      photoUrl: "",
      summary:
        "3 年互联网产品运营经验，擅长从用户反馈和业务数据中定位问题，推动跨团队协作落地。关注增长效率与用户体验，习惯用可量化的结果复盘每一次尝试。",
    },
    intention: {
      targetRole: "产品运营 / 用户增长",
      targetCity: "上海",
      salary: "面议",
      availability: "一个月内",
    },
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
  };
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}