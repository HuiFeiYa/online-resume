import { describe, expect, it } from "vitest";
import { analyzeResumeText, localJdMatch } from "@/lib/analysis/local";
import {
  analysisDraftSchema,
  finalizeAnalysisReport,
} from "@/lib/analysis/v2";
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
import {
  FREE_DAILY_ANALYSIS_QUOTA,
  FREE_DAILY_OPTIMIZE_QUOTA,
  beijingDayWindow,
  isVipActive,
} from "@/lib/quota";

describe("daily free quota", () => {
  it("grants exactly one free analysis and one optimization per day", () => {
    expect(FREE_DAILY_ANALYSIS_QUOTA).toBe(1);
    expect(FREE_DAILY_OPTIMIZE_QUOTA).toBe(1);
  });

  it("resets on the Beijing natural day boundary", () => {
    const morning = beijingDayWindow(Date.parse("2026-11-13T00:00:00+08:00"));
    const night = beijingDayWindow(Date.parse("2026-11-13T23:59:59+08:00"));
    expect(morning.start).toBe(night.start);
    expect(morning.end).toBe(night.end);
    expect(beijingDayWindow(Date.parse("2026-11-14T00:00:00+08:00")).start).toBe(morning.end);
  });

  it("treats expired membership as free quota", () => {
    expect(isVipActive({ isVip: 1, vipExpiresAt: Date.now() - 1000 })).toBe(false);
    expect(isVipActive({ isVip: 1, vipExpiresAt: Date.now() + 60_000 })).toBe(true);
    expect(isVipActive({ isVip: 1, vipExpiresAt: null })).toBe(true);
  });
});

const resumeText = `张三
产品运营 | 138 0000 1234 | zhangsan@example.com
工作经历
负责用户增长，通过 A/B 测试优化注册流程，使注册转化率提升 12%。
搭建用户反馈标签体系，每月处理 300 条反馈。
教育
华东理工大学 市场营销 本科
技能
熟练使用 SQL、Tableau 和 Figma`;

const validDraft = {
  informationCompleteness: { score: 18, summary: "联系方式和教育模块完整。" },
  jobMatch: { score: 14, summary: "核心技能有覆盖，业务领域部分相关。" },
  experienceQuality: {
    structureLogic: 7,
    actionContribution: 6,
    quantifiedValue: 11,
    skillsInContext: 8,
    summary: "有量化结果，但部分描述仍偏职责。" },
  careerTrajectory: {
    continuity: 4,
    progression: 3,
    stability: 3,
    summary: "时间线基本连续，晋升信息不足。" },
  issues: [
    {
      severity: "high" as const,
      dimension: "experience_quality" as const,
      section: "工作经历",
      evidence: "负责用户增长",
      issue: "开头动词偏弱，个人贡献不够突出。",
      suggestion: "改为主导或独立负责，并说明个人负责的模块。",
      rewrite: "主导用户增长专项，独立负责注册链路优化。",
    },
  ],
  quickWins: ["补充转化率优化前后的对比数据。"],
  summary: "简历基础完整，最优先提升经历中的个人贡献和量化证据。",
};

describe("resume analysis v2", () => {
  it("computes a bounded four-dimension score from fixed weights", () => {
    const report = finalizeAnalysisReport(validDraft);
    expect(report.version).toBe("2.0");
    expect(report.dimensions).toHaveLength(4);
    expect(report.dimensions.map((item) => item.max)).toEqual([20, 20, 45, 15]);
    expect(report.overallScore).toBe(18 + 14 + (7 + 6 + 11 + 8) + (4 + 3 + 3));
  });

  it("expands the core dimension into its four sub-scores", () => {
    const report = finalizeAnalysisReport(validDraft);
    const core = report.dimensions.find((item) => item.key === "experience_quality");
    expect(core?.score).toBe(32);
    expect(core?.details.map((item) => item.max)).toEqual([10, 10, 15, 10]);
  });

  it("rejects a draft whose sub-score exceeds its cap", () => {
    const parsed = analysisDraftSchema.safeParse({
      ...validDraft,
      experienceQuality: { ...validDraft.experienceQuality, quantifiedValue: 16 },
    });
    expect(parsed.success).toBe(false);
  });

  it("requires at least one evidence-based issue", () => {
    const parsed = analysisDraftSchema.safeParse({ ...validDraft, issues: [] });
    expect(parsed.success).toBe(false);
  });
});

describe("legacy local analysis", () => {
  it("keeps the local heuristic available for JD matching only", () => {
    const result = analyzeResumeText(resumeText);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
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