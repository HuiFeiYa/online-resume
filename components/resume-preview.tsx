import type { CSSProperties } from "react";
import type { ResumeData, TemplateTheme } from "@/lib/resume/schema";
import { defaultTheme } from "@/lib/resume/schema";
import { isSectionVisible } from "@/lib/resume/sections";

export type RendererKey =
  | "sidebar"
  | "classic"
  | "minimal"
  | "ats"
  | "timeline"
  | "banded"
  | "blue"
  | "compact";

export function isRendererKey(value: string | undefined): value is RendererKey {
  return ["sidebar", "classic", "minimal", "ats", "timeline", "banded", "blue", "compact"].includes(value || "");
}

function headerInfo(data: ResumeData) {
  const line1: string[] = [
    data.basics.gender,
    data.basics.birthDate ? `出生年月：${data.basics.birthDate}` : "",
    data.basics.yearsExperience ? `工作年限：${data.basics.yearsExperience}` : "",
    data.intention.targetRole ? `求职意向：${data.intention.targetRole}` : "",
  ].filter((item): item is string => Boolean(item));
  const line2: string[] = [
    data.basics.phone,
    data.basics.email,
    data.basics.school,
    data.basics.degree,
    data.basics.city,
  ].filter((item): item is string => Boolean(item));
  return { line1, line2 };
}

function SectionTitle({
  children,
  theme,
  variant,
}: {
  children: string;
  theme: TemplateTheme;
  variant: RendererKey;
}) {
  if (variant === "ats") {
    return <h2 className="mb-2 border-b border-[#333] pb-1 text-[12px] font-bold tracking-[0.08em] text-[#222]">{children}</h2>;
  }
  if (variant === "banded") {
    return <h2 className="mb-2.5 bg-[#e7e7e7] px-2 py-1 text-[13px] font-bold text-[#222]">{children}</h2>;
  }
  if (variant === "blue") {
    return (
      <h2 className="mb-2.5 border-b-2 pb-1 text-[13px] font-bold" style={{ color: "#245c9e", borderColor: "#245c9e" }}>
        {children}
      </h2>
    );
  }
  if (variant === "compact") {
    return <h2 className="mb-1.5 border-b pb-0.5 text-[12px] font-bold" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>{children}</h2>;
  }
  if (variant === "minimal") {
    return (
      <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em]">
        <span className="h-2 w-2 rounded-sm" style={{ background: theme.accent }} />
        <span style={{ color: theme.accent }}>{children}</span>
        <span className="h-px flex-1" style={{ background: `${theme.accent}33` }} />
      </h2>
    );
  }
  return <h2 className="resume-section-title" style={{ color: theme.accent, borderColor: `${theme.accent}66` }}>{children}</h2>;
}

function Bullets({ items, variant }: { items: string[]; variant: RendererKey }) {
  const visible = items.filter((item) => item.trim());
  if (!visible.length) return null;
  return (
    <ul className={variant === "compact" ? "mt-0.5 space-y-0.5" : "mt-1 space-y-1"}>
      {visible.map((item, index) => (
        <li key={`${item}-${index}`} className="relative pl-3.5 text-[12px] leading-[1.65] text-[#414641]">
          <span className="absolute left-0 top-[0.62em] h-1 w-1 rounded-full bg-current opacity-50" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Header({
  data,
  theme,
  variant,
}: {
  data: ResumeData;
  theme: TemplateTheme;
  variant: RendererKey;
}) {
  const { line1, line2 } = headerInfo(data);
  const name = data.basics.name || "你的姓名";
  const role = data.intention.targetRole || data.basics.jobTitle || "求职方向";
  const align = variant === "ats" || variant === "classic" ? "text-center" : "text-left";
  const nameSize =
    variant === "compact" ? 24 : variant === "timeline" ? 27 : variant === "blue" ? 30 : 28;
  const hasPhoto = Boolean(data.basics.photoUrl);

  return (
    <header
      className={`${align} ${variant === "banded" ? "mb-5 border-b-2 pb-4" : "mb-5 border-b pb-3"}`}
      style={{ borderColor: variant === "blue" ? "#245c9e" : `${theme.accent}66` }}
    >
      <div className={variant === "ats" || variant === "classic" ? "" : "flex items-start justify-between gap-4"}>
        <div className={variant === "ats" || variant === "classic" ? "" : "min-w-0"}>
          <h1
            className={`${theme.serif ? "font-serif" : "font-sans"} font-bold leading-tight`}
            style={{ color: variant === "blue" ? "#245c9e" : theme.accent, fontSize: nameSize }}
          >
            {name}
          </h1>
          <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-[#555d55] ${align === "text-center" ? "justify-center" : ""}`}>
            {line1.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-[#555d55] ${align === "text-center" ? "justify-center" : ""}`}>
            {line2.map((item) => <span key={item}>{item}</span>)}
          </div>
          {variant === "ats" ? <p className="mt-1 text-[11px] font-medium text-[#333]">{role}</p> : null}
        </div>
        {hasPhoto && variant !== "ats" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.basics.photoUrl} alt={name} className="h-20 w-16 shrink-0 rounded-md object-cover" />
        ) : null}
      </div>
    </header>
  );
}

function Skills({ data, theme, variant }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey }) {
  if (variant === "minimal" || variant === "blue") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {data.skills.flatMap((group) => group.items.filter(Boolean).map((item) => (
          <span key={`${group.id}-${item}`} className="rounded px-2 py-1 text-[10.5px]" style={{ color: variant === "blue" ? "#245c9e" : theme.accent, background: variant === "blue" ? "#eef4fb" : theme.pale }}>
            {item}
          </span>
        )))}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {data.skills.filter((group) => group.category || group.items.some(Boolean)).map((group) => (
        <p key={group.id} className="text-[11.5px] leading-5 text-[#454a45]">
          <span className="font-semibold">{group.category}</span>{group.category && group.items.length ? "：" : ""}{group.items.filter(Boolean).join(" / ")}
        </p>
      ))}
    </div>
  );
}

function Experience({ data, theme, variant }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey }) {
  return (
    <div className={variant === "timeline" ? "relative space-y-4 border-l pl-4" : "space-y-3.5"} style={variant === "timeline" ? { borderColor: `${theme.accent}66` } : undefined}>
      {data.experience.filter((item) => item.company || item.role || item.bullets.some(Boolean)).map((item) => (
        <article key={item.id} className={variant === "timeline" ? "relative" : ""}>
          {variant === "timeline" ? <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: theme.accent }} /> : null}
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-[#242824]">
              {item.company || "公司名称"}
              {item.role ? <span className="font-normal text-[#5c625c]"> · {item.role}</span> : null}
            </h3>
            <span className="shrink-0 text-[10.5px] text-[#8a8f89]">{item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate || "至今"}</span>
          </div>
          {item.location ? <p className="mt-0.5 text-[10.5px] text-[#8a8f89]">{item.location}</p> : null}
          <Bullets items={item.bullets} variant={variant} />
        </article>
      ))}
    </div>
  );
}

function Projects({ data, theme, variant }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey }) {
  return (
    <div className="space-y-3.5">
      {data.projects.filter((item) => item.name || item.role || item.tech.length || item.bullets.some(Boolean)).map((item) => (
        <article key={item.id}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-[#242824]">
              {item.name || "项目名称"}
              {item.role ? <span className="font-normal text-[#5c625c]"> · {item.role}</span> : null}
            </h3>
            <span className="shrink-0 text-[10.5px] text-[#8a8f89]">{item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate || ""}</span>
          </div>
          {item.tech.length ? <p className="mt-0.5 text-[10.5px] text-[#6f766f]">{item.tech.join(" / ")}</p> : null}
          <Bullets items={item.bullets} variant={variant} />
        </article>
      ))}
    </div>
  );
}

function Education({ data, theme, variant }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey }) {
  return (
    <div className="space-y-2.5">
      {data.education.filter((item) => item.school || item.degree || item.major || item.highlights.some(Boolean)).map((item) => (
        <article key={item.id}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[12.5px] font-semibold text-[#242824]">{item.school || "学校名称"}<span className="ml-1.5 font-normal text-[#5c625c]">{item.major}</span></h3>
            <span className="shrink-0 text-[10.5px] text-[#8a8f89]">{item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate}</span>
          </div>
          {item.degree ? <p className="text-[10.5px] text-[#6f766f]">{item.degree}</p> : null}
          <Bullets items={item.highlights} variant={variant} />
        </article>
      ))}
    </div>
  );
}

function SectionBody({ data, theme, variant, sectionKey }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey; sectionKey: string }) {
  switch (sectionKey) {
    case "skills": return <Skills data={data} theme={theme} variant={variant} />;
    case "experience": return <Experience data={data} theme={theme} variant={variant} />;
    case "projects": return <Projects data={data} theme={theme} variant={variant} />;
    case "evaluation": return <p className="text-[12px] leading-[1.75] text-[#454a45]">{data.evaluation}</p>;
    case "education": return <Education data={data} theme={theme} variant={variant} />;
    case "certificates": return <p className="text-[11.5px] leading-5 text-[#454a45]">{data.certificates.filter(Boolean).join(" · ")}</p>;
    case "languages": return <p className="text-[11.5px] leading-5 text-[#454a45]">{data.languages.filter(Boolean).join(" · ")}</p>;
    case "custom":
      return (
        <div className="space-y-3">
          {data.customSections.filter((section) => section.title || section.bullets.some(Boolean)).map((section) => (
            <div key={section.id}>
              <h3 className="mb-1 text-[12px] font-semibold text-[#303530]">{section.title}</h3>
              <Bullets items={section.bullets} variant={variant} />
            </div>
          ))}
        </div>
      );
    default: return null;
  }
}

const DEFAULT_ORDER = ["skills", "experience", "projects", "evaluation", "education", "certificates", "languages", "custom"];
const TITLES: Record<string, string> = {
  skills: "专业技能",
  experience: "工作经历",
  projects: "项目经历",
  evaluation: "个人优势",
  education: "教育背景",
  certificates: "证书资质",
  languages: "语言能力",
  custom: "自定义模块",
};

function Sections({ data, theme, variant, order = DEFAULT_ORDER }: { data: ResumeData; theme: TemplateTheme; variant: RendererKey; order?: string[] }) {
  return (
    <>
      {order.map((key) => {
        if (!isSectionVisible(data, key as any)) return null;
        return (
          <section key={key}>
            <SectionTitle theme={theme} variant={variant}>{TITLES[key] || key}</SectionTitle>
            <SectionBody data={data} theme={theme} variant={variant} sectionKey={key} />
          </section>
        );
      })}
    </>
  );
}

export default function ResumePreview({
  data,
  theme = defaultTheme,
  rendererKey = "classic",
  scale,
}: {
  data: ResumeData;
  theme?: TemplateTheme;
  rendererKey?: string;
  scale?: number;
}) {
  const variant = isRendererKey(rendererKey) ? rendererKey : "ats";
  const paperStyle: CSSProperties = scale ? { transform: `scale(${scale})` } : {};
  const sidebar = variant === "sidebar" || variant === "compact";

  return (
    <div className="resume-paper origin-top overflow-hidden" style={paperStyle}>
      {sidebar ? (
        <div className="flex min-h-[1123px]">
          <aside className={`${variant === "compact" ? "w-[27%] p-5" : "w-[31%] p-6"}`} style={{ background: theme.pale }}>
            <div className="mb-5">
              <h1 className={`${theme.serif ? "font-serif" : "font-sans"} text-[26px] font-bold`} style={{ color: theme.accent }}>{data.basics.name || "你的姓名"}</h1>
              <p className="mt-1 text-[12px] text-[#565d56]">{data.intention.targetRole || data.basics.jobTitle || "求职方向"}</p>
            </div>
            <div className="space-y-4">
              <section>
                <SectionTitle theme={theme} variant={variant}>个人信息</SectionTitle>
                <div className="space-y-1 text-[10.5px] leading-5 text-[#4f574f]">
                  {headerInfo(data).line1.concat(headerInfo(data).line2).map((item) => <p key={item}>{item}</p>)}
                </div>
              </section>
              {isSectionVisible(data, "skills") ? (
                <section><SectionTitle theme={theme} variant={variant}>专业技能</SectionTitle><Skills data={data} theme={theme} variant={variant} /></section>
              ) : null}
              {isSectionVisible(data, "certificates") ? (
                <section><SectionTitle theme={theme} variant={variant}>证书资质</SectionTitle><SectionBody data={data} theme={theme} variant={variant} sectionKey="certificates" /></section>
              ) : null}
              {isSectionVisible(data, "languages") ? (
                <section><SectionTitle theme={theme} variant={variant}>语言能力</SectionTitle><SectionBody data={data} theme={theme} variant={variant} sectionKey="languages" /></section>
              ) : null}
            </div>
          </aside>
          <div className={`${variant === "compact" ? "p-6" : "p-7"} min-w-0 flex-1`}>
            <div className="mb-5 border-b pb-3" style={{ borderColor: `${theme.accent}66` }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.accent }}>
                个人简历
              </p>
            </div>
            <div className={variant === "compact" ? "space-y-3.5" : "space-y-5"}>
              <Sections data={data} theme={theme} variant={variant} order={["experience", "projects", "evaluation", "education", "custom"]} />
            </div>
          </div>
        </div>
      ) : variant === "minimal" ? (
        <div className="min-h-[1123px] px-9 py-8">
          <Header data={data} theme={theme} variant={variant} />
          <div className="grid grid-cols-[1fr_190px] gap-6">
            <div className="min-w-0 space-y-5">
              <Sections data={data} theme={theme} variant={variant} order={["experience", "projects", "evaluation"]} />
            </div>
            <div className="space-y-5 border-l pl-5" style={{ borderColor: `${theme.accent}22` }}>
              <Sections data={data} theme={theme} variant={variant} order={["skills", "education", "certificates", "languages", "custom"]} />
            </div>
          </div>
        </div>
      ) : (
        <div className={`${variant === "ats" ? "px-10 py-9" : "px-9 py-8"} min-h-[1123px]`}>
          <Header data={data} theme={theme} variant={variant} />
          <div className="space-y-4"><Sections data={data} theme={theme} variant={variant} /></div>
        </div>
      )}
    </div>
  );
}