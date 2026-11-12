import { describe, expect, it } from "vitest";
import { analyzeResumeText, localJdMatch } from "@/lib/analysis/local";
import {
  createDemoResume,
  normalizeResumeData,
  resumeDataSchema,
} from "@/lib/resume/schema";
import {
  clearSection,
  hasSectionContent,
  isSectionVisible,
} from "@/lib/resume/sections";

const resumeText = `张三
产品运营 | 138 0000 1234 | zhangsan@example.com
工作经历
负责用户增长，通过 A/B 测试优化注册流程，使注册转化率提升 12%。
搭建用户反馈标签体系，每月处理 300 条反馈。
教育
华东理工大学 市场营销 本科
技能
熟练使用 SQL、Tableau 和 Figma`;

describe("resume analysis", () => {
  it("returns a bounded six-dimension score", () => {
    const result = analyzeResumeText(resumeText);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.dimensions).toHaveLength(6);
    expect(result.dimensions.reduce((sum, item) => sum + item.max, 0)).toBe(100);
  });

  it("flags missing contact information", () => {
    const result = analyzeResumeText("负责产品运营工作，参与活动策划，协助团队完成项目。");
    expect(result.issues.some((issue) => issue.section === "基础信息")).toBe(true);
  });

  it("matches requirements against resume evidence", () => {
    const result = localJdMatch(
      resumeText,
      "岗位要求：\n熟练使用 SQL 和 Tableau 进行数据分析；\n具备用户增长和 A/B 测试经验；\n本科及以上学历。",
    );
    expect(result.requirements.length).toBe(3);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.requirements.some((item) => item.status === "matched")).toBe(true);
  });
});

describe("resume data normalization", () => {
  it("accepts a minimal legacy resume and fills the new header fields", () => {
    const parsed = normalizeResumeData({
      basics: {
        name: "张三",
        jobTitle: "",
        phone: "",
        email: "",
        summary: "三年前端开发经验",
      },
      intention: {},
      education: [{ id: "e1", school: "武汉大学", degree: "本科", major: "软件工程", highlights: [] }],
      experience: [],
      projects: [],
      skills: [],
      certificates: [],
      languages: [],
      customSections: [],
    });
    expect(parsed.basics.gender).toBe("");
    expect(parsed.basics.birthDate).toBe("");
    expect(parsed.basics.school).toBe("武汉大学");
    expect(parsed.basics.degree).toBe("本科");
    expect(parsed.evaluation).toBe("三年前端开发经验");
    expect(parsed.sectionVisibility.skills).toBe(true);
  });

  it("still accepts a schema-compatible empty resume", () => {
    const parsed = resumeDataSchema.safeParse({
      basics: { name: "张三", jobTitle: "", phone: "", email: "" },
      intention: {},
      education: [],
      experience: [],
      projects: [],
      skills: [],
      certificates: [],
      languages: [],
      customSections: [],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("resume section visibility", () => {
  it("hides empty sections without user action", () => {
    const data = normalizeResumeData({ basics: { name: "张三" }, intention: {} });
    expect(hasSectionContent(data, "experience")).toBe(false);
    expect(isSectionVisible(data, "experience")).toBe(false);
  });

  it("keeps content but hides it after toggling visibility", () => {
    const data = createDemoResume();
    const hidden = {
      ...data,
      sectionVisibility: { ...data.sectionVisibility, projects: false },
    };
    expect(hasSectionContent(hidden, "projects")).toBe(true);
    expect(isSectionVisible(hidden, "projects")).toBe(false);
    expect(hidden.projects).toHaveLength(data.projects.length);
  });

  it("clears content when a section is deleted", () => {
    const data = createDemoResume();
    const cleared = clearSection(data, "experience");
    expect(cleared.experience).toHaveLength(0);
    expect(cleared.sectionVisibility.experience).toBe(false);
  });
});