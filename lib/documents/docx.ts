import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeData, TemplateTheme } from "@/lib/resume/schema";
import { defaultTheme } from "@/lib/resume/schema";

function sectionTitle(title: string, theme: TemplateTheme): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 90 },
    border: {
      bottom: { color: theme.accent.replace("#", ""), size: 8, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: theme.accent.replace("#", ""),
        size: 22,
        font: "Microsoft YaHei",
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Microsoft YaHei" })],
  });
}

function line(text: string, bold = false, color = "333333"): Paragraph {
  return new Paragraph({
    spacing: { after: 50 },
    children: [
      new TextRun({
        text,
        bold,
        color,
        size: bold ? 21 : 20,
        font: "Microsoft YaHei",
      }),
    ],
  });
}

export async function buildResumeDocx(
  data: ResumeData,
  theme: TemplateTheme = defaultTheme,
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: data.basics.name || "姓名",
          bold: true,
          size: 38,
          color: "1f1c18",
          font: "Microsoft YaHei",
        }),
      ],
    }),
  ];

  const contacts = [
    data.basics.jobTitle,
    data.basics.phone,
    data.basics.email,
    data.basics.city,
    data.basics.wechat ? `微信 ${data.basics.wechat}` : "",
  ].filter(Boolean);
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: contacts.join("  |  "),
          size: 19,
          color: "666666",
          font: "Microsoft YaHei",
        }),
      ],
    }),
  );

  if (data.basics.summary) {
    children.push(sectionTitle("个人简介", theme), line(data.basics.summary));
  }

  if (data.intention.targetRole || data.intention.targetCity || data.intention.salary) {
    children.push(
      sectionTitle("求职意向", theme),
      line(
        [
          data.intention.targetRole,
          data.intention.targetCity,
          data.intention.salary,
          data.intention.availability,
        ]
          .filter(Boolean)
          .join("  |  "),
      ),
    );
  }

  if (data.experience.length) {
    children.push(sectionTitle("工作经历", theme));
    for (const item of data.experience) {
      children.push(
        line(`${item.company}  ·  ${item.role}`, true),
        line(
          [item.location, `${item.startDate || ""} - ${item.endDate || "至今"}`]
            .filter(Boolean)
            .join("  |  "),
          false,
          "777777",
        ),
        ...item.bullets.filter(Boolean).map(bullet),
      );
    }
  }

  if (data.projects.length) {
    children.push(sectionTitle("项目经历", theme));
    for (const item of data.projects) {
      children.push(
        line(
          `${item.name}${item.role ? `  ·  ${item.role}` : ""}`,
          true,
        ),
        line(
          [item.tech.join(" / "), `${item.startDate || ""} - ${item.endDate || ""}`]
            .filter(Boolean)
            .join("  |  "),
          false,
          "777777",
        ),
        ...item.bullets.filter(Boolean).map(bullet),
      );
    }
  }

  if (data.education.length) {
    children.push(sectionTitle("教育背景", theme));
    for (const item of data.education) {
      children.push(
        line(`${item.school}  ·  ${item.major}  ·  ${item.degree}`, true),
        line(`${item.startDate || ""} - ${item.endDate || ""}`, false, "777777"),
        ...item.highlights.filter(Boolean).map(bullet),
      );
    }
  }

  if (data.skills.length) {
    children.push(sectionTitle("专业技能", theme));
    for (const group of data.skills) {
      children.push(line(`${group.category}：${group.items.join(" / ")}`, false));
    }
  }

  if (data.certificates.length) {
    children.push(sectionTitle("证书与资质", theme));
    children.push(line(data.certificates.join("  ·  ")));
  }

  if (data.languages.length) {
    children.push(sectionTitle("语言能力", theme));
    children.push(line(data.languages.join("  ·  ")));
  }

  for (const section of data.customSections) {
    if (!section.title) continue;
    children.push(sectionTitle(section.title, theme));
    children.push(...section.bullets.filter(Boolean).map(bullet));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Microsoft YaHei", size: 20, color: "333333" },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export function safeDocxName(name: string, fallback = "我的简历"): string {
  const cleaned = (name || fallback)
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 80);
  return `${cleaned || fallback}.docx`;
}