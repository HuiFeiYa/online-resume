import type { ResumeData, SectionKey } from "@/lib/resume/schema";

export type SectionDefinition = {
  key: SectionKey;
  title: string;
  editable: boolean;
  deletable: boolean;
};

export const RESUME_SECTIONS: SectionDefinition[] = [
  { key: "skills", title: "专业技能", editable: true, deletable: true },
  { key: "experience", title: "工作经历", editable: true, deletable: true },
  { key: "projects", title: "项目经历", editable: true, deletable: true },
  { key: "evaluation", title: "个人评价", editable: true, deletable: true },
  { key: "education", title: "教育背景", editable: true, deletable: true },
  { key: "certificates", title: "证书资质", editable: true, deletable: true },
  { key: "languages", title: "语言能力", editable: true, deletable: true },
  { key: "custom", title: "自定义模块", editable: true, deletable: true },
];

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnyText(values: unknown[]): boolean {
  return values.some(hasText);
}

export function hasSectionContent(data: ResumeData, key: SectionKey): boolean {
  switch (key) {
    case "skills":
      return data.skills.some(
        (group) => hasText(group.category) || group.items.some(hasText),
      );
    case "experience":
      return data.experience.some(
        (item) =>
          hasText(item.company) ||
          hasText(item.role) ||
          hasAnyText(item.bullets),
      );
    case "projects":
      return data.projects.some(
        (item) =>
          hasText(item.name) ||
          hasText(item.role) ||
          item.tech.some(hasText) ||
          hasAnyText(item.bullets),
      );
    case "evaluation":
      return hasText(data.evaluation) || hasText(data.basics.summary);
    case "education":
      return data.education.some(
        (item) =>
          hasText(item.school) ||
          hasText(item.degree) ||
          hasText(item.major) ||
          hasAnyText(item.highlights),
      );
    case "certificates":
      return data.certificates.some(hasText);
    case "languages":
      return data.languages.some(hasText);
    case "custom":
      return data.customSections.some(
        (section) => hasText(section.title) || hasAnyText(section.bullets),
      );
    default:
      return false;
  }
}

export function isSectionVisible(data: ResumeData, key: SectionKey): boolean {
  return data.sectionVisibility[key] !== false && hasSectionContent(data, key);
}

export function clearSection(data: ResumeData, key: SectionKey): ResumeData {
  const invisible = {
    ...data.sectionVisibility,
    [key]: false,
  };
  switch (key) {
    case "skills":
      return { ...data, skills: [], sectionVisibility: invisible };
    case "experience":
      return { ...data, experience: [], sectionVisibility: invisible };
    case "projects":
      return { ...data, projects: [], sectionVisibility: invisible };
    case "evaluation":
      return {
        ...data,
        evaluation: "",
        basics: { ...data.basics, summary: "" },
        sectionVisibility: invisible,
      };
    case "education":
      return { ...data, education: [], sectionVisibility: invisible };
    case "certificates":
      return { ...data, certificates: [], sectionVisibility: invisible };
    case "languages":
      return { ...data, languages: [], sectionVisibility: invisible };
    case "custom":
      return { ...data, customSections: [], sectionVisibility: invisible };
    default:
      return data;
  }
}

export function sectionCompletion(data: ResumeData): number {
  const sections = RESUME_SECTIONS.filter((section) => section.key !== "custom");
  const complete = sections.filter(
    (section) =>
      isSectionVisible(data, section.key) ||
      data.sectionVisibility[section.key] === false,
  ).length;
  return Math.round((complete / sections.length) * 100);
}