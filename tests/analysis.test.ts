import { describe, expect, it } from "vitest";
import { analyzeResumeText, localJdMatch } from "@/lib/analysis/local";
import { resumeDataSchema } from "@/lib/resume/schema";

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

describe("resume data schema", () => {
  it("accepts a minimal valid resume", () => {
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