import type { ResumeData, TemplateTheme } from "@/lib/resume/schema";
import { defaultTheme } from "@/lib/resume/schema";

function SectionTitle({ children, theme }: { children: string; theme: TemplateTheme }) {
  return (
    <h2
      className="resume-section-title"
      style={{ color: theme.accent, borderColor: `${theme.accent}66` }}
    >
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: string[] }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <ul className="mt-1 space-y-1">
      {visible.map((item, index) => (
        <li key={`${item}-${index}`} className="relative pl-3.5 text-[12px] leading-[1.65] text-[#414641]">
          <span className="absolute left-0 top-[0.62em] h-1 w-1 rounded-full bg-current opacity-50" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function MainContent({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  return (
    <div className="space-y-5">
      {data.basics.summary ? (
        <section>
          <SectionTitle theme={theme}>个人简介</SectionTitle>
          <p className="text-[12px] leading-[1.75] text-[#454a45]">{data.basics.summary}</p>
        </section>
      ) : null}

      {data.experience.length ? (
        <section>
          <SectionTitle theme={theme}>工作经历</SectionTitle>
          <div className="space-y-3.5">
            {data.experience.map((item) => (
              <article key={item.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[13px] font-semibold text-[#242824]">
                    {item.company || "公司名称"}
                    {item.role ? <span className="font-normal text-[#5c625c]"> · {item.role}</span> : null}
                  </h3>
                  <span className="shrink-0 text-[10.5px] text-[#8a8f89]">
                    {item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate || "至今"}
                  </span>
                </div>
                {item.location ? <p className="mt-0.5 text-[10.5px] text-[#8a8f89]">{item.location}</p> : null}
                <Bullets items={item.bullets} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.projects.length ? (
        <section>
          <SectionTitle theme={theme}>项目经历</SectionTitle>
          <div className="space-y-3.5">
            {data.projects.map((item) => (
              <article key={item.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[13px] font-semibold text-[#242824]">
                    {item.name || "项目名称"}
                    {item.role ? <span className="font-normal text-[#5c625c]"> · {item.role}</span> : null}
                  </h3>
                  <span className="shrink-0 text-[10.5px] text-[#8a8f89]">
                    {item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate || ""}
                  </span>
                </div>
                {item.tech.length ? (
                  <p className="mt-0.5 text-[10.5px] text-[#6f766f]">{item.tech.join(" / ")}</p>
                ) : null}
                <Bullets items={item.bullets} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.education.length ? (
        <section>
          <SectionTitle theme={theme}>教育背景</SectionTitle>
          <div className="space-y-2.5">
            {data.education.map((item) => (
              <article key={item.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12.5px] font-semibold text-[#242824]">
                    {item.school || "学校名称"}
                    <span className="ml-1.5 font-normal text-[#5c625c]">{item.major}</span>
                  </h3>
                  <span className="shrink-0 text-[10.5px] text-[#8a8f89]">
                    {item.startDate}{item.startDate || item.endDate ? " - " : ""}{item.endDate}
                  </span>
                </div>
                {item.degree ? <p className="text-[10.5px] text-[#6f766f]">{item.degree}</p> : null}
                <Bullets items={item.highlights} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.customSections.map((section) => (
        <section key={section.id}>
          <SectionTitle theme={theme}>{section.title || "自定义模块"}</SectionTitle>
          <Bullets items={section.bullets} />
        </section>
      ))}
    </div>
  );
}

function Sidebar({ data, theme }: { data: ResumeData; theme: TemplateTheme }) {
  return (
    <aside className="w-[31%] shrink-0 p-6" style={{ background: theme.pale }}>
      <div className="space-y-5">
        {data.intention.targetRole ? (
          <section>
            <h2 className="mb-2 border-b pb-1 text-[11px] font-bold tracking-[0.12em]" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>
              求职意向
            </h2>
            <p className="text-[12px] font-semibold text-[#303530]">{data.intention.targetRole}</p>
            <div className="mt-1 space-y-1 text-[11px] leading-5 text-[#5b625b]">
              {data.intention.targetCity ? <p>城市：{data.intention.targetCity}</p> : null}
              {data.intention.salary ? <p>薪资：{data.intention.salary}</p> : null}
              {data.intention.availability ? <p>到岗：{data.intention.availability}</p> : null}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 border-b pb-1 text-[11px] font-bold tracking-[0.12em]" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>
            联系方式
          </h2>
          <div className="space-y-1.5 text-[11px] leading-5 text-[#4f574f]">
            {data.basics.phone ? <p>{data.basics.phone}</p> : null}
            {data.basics.email ? <p className="break-all">{data.basics.email}</p> : null}
            {data.basics.wechat ? <p>微信 {data.basics.wechat}</p> : null}
            {data.basics.city ? <p>{data.basics.city}</p> : null}
            {data.basics.website ? <p className="break-all">{data.basics.website}</p> : null}
          </div>
        </section>

        {data.skills.length ? (
          <section>
            <h2 className="mb-2 border-b pb-1 text-[11px] font-bold tracking-[0.12em]" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>
              专业技能
            </h2>
            <div className="space-y-2.5">
              {data.skills.map((group) => (
                <div key={group.id}>
                  <p className="text-[11px] font-semibold text-[#3d443d]">{group.category}</p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.7] text-[#5b625b]">{group.items.join(" · ")}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.certificates.length ? (
          <section>
            <h2 className="mb-2 border-b pb-1 text-[11px] font-bold tracking-[0.12em]" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>
              证书资质
            </h2>
            <ul className="space-y-1 text-[10.5px] leading-[1.7] text-[#5b625b]">
              {data.certificates.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ) : null}

        {data.languages.length ? (
          <section>
            <h2 className="mb-2 border-b pb-1 text-[11px] font-bold tracking-[0.12em]" style={{ color: theme.accent, borderColor: `${theme.accent}55` }}>
              语言能力
            </h2>
            <ul className="space-y-1 text-[10.5px] leading-[1.7] text-[#5b625b]">
              {data.languages.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

export default function ResumePreview({
  data,
  theme = defaultTheme,
  scale,
}: {
  data: ResumeData;
  theme?: TemplateTheme;
  scale?: number;
}) {
  const sidebar = theme.sidebar;
  const name = data.basics.name || "你的姓名";
  const title = data.basics.jobTitle || data.intention.targetRole || "求职方向";
  const contacts = [data.basics.phone, data.basics.email, data.basics.city].filter(Boolean);

  return (
    <div
      className="resume-paper origin-top overflow-hidden"
      style={scale ? { transform: `scale(${scale})` } : undefined}
    >
      <div className={sidebar ? "flex min-h-[1123px]" : ""}>
        {sidebar ? <Sidebar data={data} theme={theme} /> : null}
        <div className={sidebar ? "min-w-0 flex-1 p-7" : "p-9"}>
          <header className={sidebar ? "mb-5" : "mb-6 border-b pb-4"} style={{ borderColor: `${theme.accent}55` }}>
            <h1
              className={`${theme.serif ? "font-serif" : "font-sans"} text-[28px] font-bold leading-tight`}
              style={{ color: theme.accent }}
            >
              {name}
            </h1>
            <p className="mt-1 text-[13px] text-[#565d56]">{title}</p>
            {!sidebar && contacts.length ? (
              <p className="mt-2 text-[11px] text-[#747b74]">{contacts.join("  |  ")}</p>
            ) : null}
          </header>
          <MainContent data={data} theme={theme} />
        </div>
      </div>
    </div>
  );
}