export type ResumeIssue = {
  severity: "high" | "medium" | "low";
  section: string;
  evidence: string;
  issue: string;
  suggestion: string;
  rewrite?: string;
};

export type DimensionScore = {
  key: string;
  label: string;
  score: number;
  max: number;
  summary: string;
};

export type ResumeAnalysis = {
  overallScore: number;
  dimensions: DimensionScore[];
  issues: ResumeIssue[];
  quickWins: string[];
  summary: string;
};

type TextSignals = {
  hasPhone: boolean;
  hasEmail: boolean;
  hasEducation: boolean;
  hasExperience: boolean;
  hasSkills: boolean;
  bulletLines: number;
  quantifiedLines: number;
  weakVerbLines: number;
  duplicateLines: number;
  longParagraphs: number;
  totalChars: number;
  lines: string[];
};

function collectSignals(text: string): TextSignals {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const nonEmpty = lines.filter((line) => line.length > 2);
  const counts = new Map<string, number>();
  for (const line of nonEmpty) counts.set(line, (counts.get(line) || 0) + 1);
  const bulletLines = nonEmpty.filter((line) => line.length >= 12).length;
  return {
    hasPhone: /(?:1[3-9]\d[\s-]?\d{4}[\s-]?\d{4})|(?:\+?\d{1,3}[-\s]\d{3,4}[-\s]\d{6,})/.test(text),
    hasEmail: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    hasEducation: /(教育|学历|本科|硕士|博士|大学|学院|university|college)/i.test(text),
    hasExperience: /(工作经历|实习经历|任职|公司|experience|employment)/i.test(text),
    hasSkills: /(技能|skill|熟练|掌握|精通)/i.test(text),
    bulletLines,
    quantifiedLines: nonEmpty.filter((line) => /\d+(?:\.\d+)?\s*(?:%|万|亿|人|个|次|天|月|年|小时|元|k|K|M)?/.test(line)).length,
    weakVerbLines: nonEmpty.filter((line) => /^(负责|参与|协助|帮助|完成|从事)/.test(line)).length,
    duplicateLines: Array.from(counts.values()).filter((count) => count > 2).length,
    longParagraphs: nonEmpty.filter((line) => line.length > 180).length,
    totalChars: text.length,
    lines: nonEmpty,
  };
}

export function analyzeResumeText(text: string): ResumeAnalysis {
  const s = collectSignals(text);
  const issues: ResumeIssue[] = [];
  const add = (issue: ResumeIssue) => issues.push(issue);

  const completeness = Math.min(
    20,
    (s.hasPhone ? 4 : 0) +
      (s.hasEmail ? 4 : 0) +
      (s.hasEducation ? 4 : 0) +
      (s.hasExperience ? 4 : 0) +
      (s.hasSkills ? 4 : 0),
  );
  if (!s.hasPhone || !s.hasEmail) {
    add({
      severity: "high",
      section: "基础信息",
      evidence: "未在两个基础联系方式字段中同时识别到手机号和邮箱。",
      issue: "招聘者无法快速联系你，或简历解析时丢失联系方式。",
      suggestion: "在简历顶部单独列出手机和邮箱，避免放进页眉图片或文本框。",
    });
  }

  const bulletRatio = s.bulletLines ? s.quantifiedLines / Math.max(1, s.bulletLines) : 0;
  const impact = Math.min(25, Math.round((s.quantifiedLines >= 6 ? 16 : s.quantifiedLines * 2.2) + Math.min(9, bulletRatio * 18)));
  if (s.quantifiedLines < 4) {
    add({
      severity: "high",
      section: "经历描述",
      evidence: "当前内容中的量化结果较少。",
      issue: "职责描述无法体现实际贡献，招聘者难以判断成果大小。",
      suggestion: "每段核心经历至少补充 1 至 2 个指标，例如转化率、数量、周期、规模或成本变化。",
      rewrite: "把“负责用户增长”改为“通过渠道优化和A/B测试，使注册转化率提升 12%”。",
    });
  }
  if (s.weakVerbLines >= 3) {
    add({
      severity: "medium",
      section: "经历描述",
      evidence: "多条经历以“负责 / 参与 / 协助”开头。",
      issue: "主语动作偏弱，难以突出你的独立贡献。",
      suggestion: "用更具体的动作替换泛化动词，例如搭建、设计、推动、重构、分析、验证。",
    });
  }

  let structure = 20;
  if (s.totalChars < 350) {
    structure -= 7;
    add({
      severity: "high",
      section: "整体结构",
      evidence: `当前有效文本约 ${s.totalChars} 字符。`,
      issue: "内容过少，可能缺少关键模块或经历细节。",
      suggestion: "补齐教育、工作/实习、项目和技能模块，删除与目标岗位无关的内容。",
    });
  }
  if (s.totalChars > 5000) {
    structure -= 5;
    add({
      severity: "medium",
      section: "整体结构",
      evidence: `当前有效文本约 ${s.totalChars} 字符。`,
      issue: "篇幅偏长，重点不够集中。",
      suggestion: "优先保留最近 3 至 5 年、与目标岗位最相关的经历。",
    });
  }
  if (s.longParagraphs) {
    structure -= Math.min(5, s.longParagraphs * 2);
    add({
      severity: "medium",
      section: "整体结构",
      evidence: `发现 ${s.longParagraphs} 段超长描述。`,
      issue: "长段落不利于快速扫描。",
      suggestion: "将长段落拆成 1 至 3 条结果导向的项目符号。",
    });
  }
  if (s.duplicateLines) {
    structure -= Math.min(4, s.duplicateLines);
    add({
      severity: "low",
      section: "整体结构",
      evidence: "检测到重复出现的内容。",
      issue: "重复表达会稀释重点。",
      suggestion: "合并重复内容，保留最能证明能力的一条。",
    });
  }
  structure = Math.max(0, structure);

  const skills = Math.min(15, (s.hasSkills ? 8 : 3) + Math.min(7, s.quantifiedLines));
  const format = Math.max(2, 10 - (s.longParagraphs > 0 ? 2 : 0) - (!s.hasEmail || !s.hasPhone ? 2 : 0));
  const consistency = Math.max(2, 10 - (s.duplicateLines > 0 ? 2 : 0) - (s.totalChars > 5000 ? 2 : 0));

  const overallScore = completeness + impact + structure + skills + format + consistency;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    dimensions: [
      { key: "completeness", label: "信息完整度", score: completeness, max: 20, summary: "联系方式与核心模块是否齐全" },
      { key: "impact", label: "经历影响力", score: impact, max: 25, summary: "是否用结果和数字证明贡献" },
      { key: "structure", label: "结构与表达", score: structure, max: 20, summary: "重点、篇幅与分段是否清晰" },
      { key: "skills", label: "技能与关键词", score: skills, max: 15, summary: "是否明确呈现岗位相关能力" },
      { key: "format", label: "格式与可读性", score: format, max: 10, summary: "是否方便快速扫描和机器解析" },
      { key: "consistency", label: "一致性与风险", score: consistency, max: 10, summary: "是否存在重复或时间线风险" },
    ],
    issues: issues.length ? issues : [{
      severity: "low",
      section: "整体",
      evidence: "未发现明显结构性问题。",
      issue: "简历已经具备基本可读性。",
      suggestion: "建议继续针对目标岗位补充关键词，并用更具体的指标强化成果。",
    }],
    quickWins: [
      "把目标岗位名称写到简历顶部，方便招聘者快速判断方向。",
      "为每段经历补充一个可量化结果。",
      "删掉和目标岗位无关、无法证明能力的描述。",
    ],
    summary:
      overallScore >= 80
        ? "简历基础扎实，建议继续针对具体 JD 做关键词和经历匹配。"
        : overallScore >= 60
          ? "简历信息基本完整，但成果表达和结构仍有明显提升空间。"
          : "简历需要先补齐关键信息，再把职责描述改写成可验证的成果。",
  };
}

export function localJdMatch(text: string, jd: string) {
  const normalized = text.toLowerCase();
  const requirements = jd
    .split(/\n|[；;。]/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 6)
    .slice(0, 12);
  const items = requirements.map((requirement) => {
    const words = Array.from(
      new Set(
        requirement
          .replace(/[^\p{L}\p{N}+#./ -]/gu, " ")
          .split(/\s+/)
          .map((word) => word.trim())
          .filter((word) => word.length >= 2),
      ),
    ).slice(0, 8);
    const hits = words.filter((word) => normalized.includes(word.toLowerCase()));
    const ratio = words.length ? hits.length / words.length : 0;
    return {
      requirement,
      status: ratio >= 0.6 ? "matched" : ratio >= 0.25 ? "partial" : "missing",
      evidence: hits.length ? `简历中出现：${hits.join("、")}` : "简历中未找到对应关键词或经历证据",
      suggestion:
        ratio >= 0.6
          ? "保留当前表达，补充一条更具体的结果。"
          : "如确有相关经历，请在对应模块补充项目、工具、职责和结果。",
    };
  });
  const matched = items.filter((item) => item.status === "matched").length;
  const partial = items.filter((item) => item.status === "partial").length;
  const score = items.length ? Math.round(((matched + partial * 0.5) / items.length) * 100) : 60;
  return {
    score,
    requirements: items,
    missingKeywords: items.filter((item) => item.status === "missing").map((item) => item.requirement),
    summary: score >= 75
      ? "简历和 JD 的整体重合度较高，建议补充关键要求的成果证据。"
      : score >= 45
        ? "存在一定匹配基础，但仍有关键词或经历没有被简历体现。"
        : "当前简历与 JD 的重合度较低，需要优先调整目标定位和关键词。",
  };
}