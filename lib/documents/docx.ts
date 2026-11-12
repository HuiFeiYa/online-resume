import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ResumeData, TemplateTheme } from "@/lib/resume/schema";
import { defaultTheme } from "@/lib/resume/schema";
import { isSectionVisible } from "@/lib/resume/sections";

function accent(theme: TemplateTheme): string {
  return theme.accent.replace("#", "");
}

function sectionTitle(title: string, theme: TemplateTheme, rendererKey = "classic"): Paragraph {
  const fill = rendererKey === "banded" ? "E7E7E7" : undefined;
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: rendererKey === "compact" ? 120 : 180, after: 90 },
    shading: fill ? { fill } : undefined,
    border: rendererKey === "banded" ? undefined : {
      bottom: { color: accent(theme), size: 8, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        color: rendererKey === "blue" ? "245C9E" : accent(theme),
        size: rendererKey === "compact" ? 20 : 22,
        font: "Microsoft YaHei",
      }),
    ],
  });
}

function bullet(text: string, compact = false): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: compact ? 30 : 60 },
    children: [new TextRun({ text, size: compact ? 19 : 20, font: "Microsoft YaHei" })],
  });
}

function line(text: string, bold = false, color = "333333", compact = false): Paragraph {
  return new Paragraph({
    spacing: { after: compact ? 30 : 50 },
    children: [
      new TextRun({
        text,
        bold,
        color,
        size: bold ? 20 : compact ? 19 : 20,
        font: "Microsoft YaHei",
      }),
    ],
  });
}

export async function buildResumeDocx(
  data: ResumeData,
  theme: TemplateTheme = defaultTheme,
  rendererKey = "classic",
): Promise<Buffer> {
  const compact = rendererKey === "compact";
  const line1 = [
    data.basics.gender,
    data.basics.birthDate ? `出生年月：${data.basics.birthDate}` : "",
    data.basics.yearsExperience ? `工作年限：${data.basics.yearsExperience}` : "",
    data.intention.targetRole ? `求职意向：${data.intention.targetRole}` : "",
  ].filter(Boolean).join("  |  ");
  const line2 = [
    data.basics.phone,
    data.basics.email,
    data.basics.school,
    data.basics.degree,
    data.basics.city,
  ].filter(Boolean).join("  |  ");

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [new TextRun({ text: data.basics.name || "姓名", bold: true, size: compact ? 34 : 38, color: rendererKey === "blue" ? "245C9E" : "1F1C18", font: "Microsoft YaHei" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: line1, size: 19, color: "555555", font: "Microsoft YaHei" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [new TextRun({ text: line2, size: 19, color: "555555", font: "Microsoft YaHei" })],
    }),
  ];

  if (isSectionVisible(data, "skills")) {
    children.push(sectionTitle("专业技能", theme, rendererKey));
    for (const group of data.skills.filter((item) => item.category || item.items.length)) {
      children.push(line(`${group.category}${group.category && group.items.length ? "：" : ""}${group.items.filter(Boolean).join(" / ")}`, false, "333333", compact));
    }
  }

  if (isSectionVisible(data, "experience")) {
    children.push(sectionTitle("工作经历", theme, rendererKey));
    for (const item of data.experience) {
      children.push(
        line(`${item.company}  ·  ${item.role}`, true, "333333", compact),
        line([item.location, `${item.startDate || ""} - ${item.endDate || "至今"}`].filter(Boolean).join("  |  "), false, "777777", compact),
        ...item.bullets.filter(Boolean).map((value) => bullet(value, compact)),
      );
    }
  }

  if (isSectionVisible(data, "projects")) {
    children.push(sectionTitle("项目经历", theme, rendererKey));
    for (const item of data.projects) {
      children.push(
        line(`${item.name}${item.role ? `  ·  ${item.role}` : ""}`, true, "333333", compact),
        line([item.tech.join(" / "), `${item.startDate || ""} - ${item.endDate || ""}`].filter(Boolean).join("  |  "), false, "777777", compact),
        ...item.bullets.filter(Boolean).map((value) => bullet(value, compact)),
      );
    }
  }

  if (isSectionVisible(data, "evaluation")) {
    children.push(sectionTitle("个人优势", theme, rendererKey), line(data.evaluation));
  }

  if (isSectionVisible(data, "education")) {
    children.push(sectionTitle("教育背景", theme, rendererKey));
    for (const item of data.education) {
      children.push(
        line(`${item.school}  ·  ${item.major}  ·  ${item.degree}`, true, "333333", compact),
        line(`${item.startDate || ""} - ${item.endDate || ""}`, false, "777777", compact),
        ...item.highlights.filter(Boolean).map((value) => bullet(value, compact)),
      );
    }
  }

  if (isSectionVisible(data, "certificates")) {
    children.push(sectionTitle("证书资质", theme, rendererKey), line(data.certificates.filter(Boolean).join("  ·  ")));
  }
  if (isSectionVisible(data, "languages")) {
    children.push(sectionTitle("语言能力", theme, rendererKey), line(data.languages.filter(Boolean).join("  ·  ")));
  }
  if (isSectionVisible(data, "custom")) {
    for (const section of data.customSections) {
      if (!section.title && !section.bullets.some(Boolean)) continue;
      children.push(sectionTitle(section.title || "自定义模块", theme, rendererKey));
      children.push(...section.bullets.filter(Boolean).map((value) => bullet(value, compact)));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Microsoft YaHei", size: compact ? 19 : 20, color: "333333" },
          paragraph: { spacing: { line: compact ? 260 : 300 } },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export function safeDocxName(name: string, fallback = "我的简历"): string {
  const cleaned = (name || fallback).replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 80);
  return `${cleaned || fallback}.docx`;
}

export function exportBaseName(data: ResumeData, fallback = "我的简历"): string {
  const role = data.intention.targetRole || data.basics.jobTitle || "";
  const raw = [data.basics.name || fallback, role, "简历"].filter(Boolean).join("-");
  return raw.replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 100);
}