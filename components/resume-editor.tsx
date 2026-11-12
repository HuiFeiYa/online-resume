"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Download,
  GraduationCap,
  Layers3,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import ResumePreview from "@/components/resume-preview";
import {
  createId,
  type ResumeData,
  type TemplateTheme,
} from "@/lib/resume/schema";

type Props = {
  resumeId: string;
  initialTitle: string;
  initialData: ResumeData;
  initialRevision: number;
  theme: TemplateTheme;
};

type SaveState = "saved" | "saving" | "dirty" | "error";

const sectionLabels = [
  ["basics", "基本信息"],
  ["intention", "求职意向"],
  ["education", "教育背景"],
  ["experience", "工作经历"],
  ["projects", "项目经历"],
  ["skills", "专业技能"],
  ["certificates", "证书语言"],
  ["custom", "自定义模块"],
] as const;

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  className = "",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="field-label">{label}</span>
      {textarea ? (
        <textarea
          className="field-textarea"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="field-input"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function LineEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex items-center gap-1 text-xs text-primary-pine hover:underline"
        >
          <Plus size={12} /> 添加一条
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="field-input"
              value={item}
              placeholder={placeholder}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="btn-ghost w-9 shrink-0 px-0 text-ink-muted"
              title="删除这一条"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!items.length ? (
          <button
            type="button"
            onClick={() => onChange([""])}
            className="w-full rounded-md border border-dashed border-surface-line py-3 text-xs text-ink-muted hover:border-primary-teal hover:text-primary-pine"
          >
            + 添加内容
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Collapsible({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
  action,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-b border-surface-line/80 last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <Icon size={17} strokeWidth={1.7} className="text-primary-pine" />
          <span className="text-sm font-medium text-ink">{title}</span>
          {open ? <ChevronUp size={15} className="ml-auto text-ink-muted" /> : <ChevronDown size={15} className="ml-auto text-ink-muted" />}
        </button>
        {action}
      </div>
      {open ? <div className="space-y-3 px-4 pb-5">{children}</div> : null}
    </section>
  );
}

export default function ResumeEditor({
  resumeId,
  initialTitle,
  initialData,
  initialRevision,
  theme,
}: Props) {
  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState(initialTitle);
  const [revision, setRevision] = useState(initialRevision);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [openSection, setOpenSection] = useState<string>("basics");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  const latestTitle = useRef(title);
  latestData.current = data;
  latestTitle.current = title;

  const persist = useCallback(async () => {
    setSaveState("saving");
    try {
      const resp = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: latestData.current, title: latestTitle.current, revision }),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 409) {
        setSaveState("error");
        return;
      }
      if (!resp.ok) {
        setSaveState("error");
        return;
      }
      setRevision(body.revision);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [resumeId, revision]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, title, saveState, persist]);

  function update(next: Partial<ResumeData>) {
    setData((current) => ({ ...current, ...next }));
    setSaveState("dirty");
  }

  async function exportDocx() {
    setExporting(true);
    try {
      const resp = await fetch(`/api/resumes/${resumeId}/export/docx`, { method: "POST" });
      if (!resp.ok) throw new Error("export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title || "我的简历"}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const saveLabel =
    saveState === "saved"
      ? "已保存"
      : saveState === "saving"
        ? "保存中..."
        : saveState === "dirty"
          ? "未保存"
          : "保存失败";

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface-base">
      <div className="no-print sticky top-16 z-30 border-b border-surface-line bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:px-5">
          <Link href="/dashboard" className="btn-ghost shrink-0 px-2">
            ← 工作台
          </Link>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSaveState("dirty");
            }}
            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-ink outline-none hover:border-surface-line focus:border-primary-teal focus:bg-white"
            aria-label="简历标题"
          />
          <span className={`hidden items-center gap-1.5 text-xs sm:flex ${saveState === "error" ? "text-accent-danger" : "text-ink-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${saveState === "saved" ? "bg-accent-success" : saveState === "error" ? "bg-accent-danger" : "bg-accent-warn"}`} />
            {saveLabel}
          </span>
          <button type="button" onClick={() => { setSaveState("dirty"); persist(); }} className="btn-ghost hidden sm:inline-flex">
            <Save size={15} /> 保存
          </button>
          <button type="button" onClick={() => setMobilePreview((value) => !value)} className="btn-secondary lg:hidden">
            {mobilePreview ? "编辑" : "预览"}
          </button>
          <button type="button" onClick={() => window.print()} className="btn-secondary hidden sm:inline-flex">
            <Printer size={15} /> 打印 PDF
          </button>
          <button type="button" onClick={exportDocx} disabled={exporting} className="btn-primary">
            <Download size={15} /> {exporting ? "导出中" : "导出 Word"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[minmax(0,610px)_minmax(0,1fr)]">
        <div className={`${mobilePreview ? "hidden lg:block" : ""} min-w-0`}>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {sectionLabels.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setOpenSection(key)}
                className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs ${
                  openSection === key
                    ? "border-primary-pine bg-primary-pine text-white"
                    : "border-surface-line bg-white text-ink-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="surface-card-solid overflow-hidden">
            <Collapsible title="基本信息" icon={UserRound} open={openSection === "basics"} onToggle={() => setOpenSection(openSection === "basics" ? "" : "basics")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="姓名" value={data.basics.name} onChange={(value) => update({ basics: { ...data.basics, name: value } })} placeholder="你的姓名" />
                <Field label="职位 / 身份" value={data.basics.jobTitle} onChange={(value) => update({ basics: { ...data.basics, jobTitle: value } })} placeholder="例如：产品运营" />
                <Field label="手机" value={data.basics.phone} onChange={(value) => update({ basics: { ...data.basics, phone: value } })} placeholder="138 0000 0000" />
                <Field label="邮箱" value={data.basics.email} onChange={(value) => update({ basics: { ...data.basics, email: value } })} placeholder="you@example.com" />
                <Field label="微信" value={data.basics.wechat} onChange={(value) => update({ basics: { ...data.basics, wechat: value } })} placeholder="选填" />
                <Field label="所在城市" value={data.basics.city} onChange={(value) => update({ basics: { ...data.basics, city: value } })} placeholder="例如：上海" />
              </div>
              <Field label="个人简介" value={data.basics.summary} onChange={(value) => update({ basics: { ...data.basics, summary: value } })} placeholder="用 3 句话说明你的经验、优势和目标。" textarea />
            </Collapsible>

            <Collapsible title="求职意向" icon={Sparkles} open={openSection === "intention"} onToggle={() => setOpenSection(openSection === "intention" ? "" : "intention")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="目标岗位" value={data.intention.targetRole} onChange={(value) => update({ intention: { ...data.intention, targetRole: value } })} placeholder="例如：用户增长经理" />
                <Field label="目标城市" value={data.intention.targetCity} onChange={(value) => update({ intention: { ...data.intention, targetCity: value } })} placeholder="例如：上海" />
                <Field label="期望薪资" value={data.intention.salary} onChange={(value) => update({ intention: { ...data.intention, salary: value } })} placeholder="选填" />
                <Field label="到岗时间" value={data.intention.availability} onChange={(value) => update({ intention: { ...data.intention, availability: value } })} placeholder="例如：一个月内" />
              </div>
            </Collapsible>

            <Collapsible
              title="工作经历"
              icon={BriefcaseBusiness}
              open={openSection === "experience"}
              onToggle={() => setOpenSection(openSection === "experience" ? "" : "experience")}
              action={
                <button
                  type="button"
                  onClick={() => {
                    update({
                      experience: [
                        ...data.experience,
                        {
                          id: createId("exp"),
                          company: "",
                          role: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          bullets: [""],
                        },
                      ],
                    });
                    setOpenSection("experience");
                  }}
                  className="btn-ghost h-7 px-2 text-xs"
                >
                  <Plus size={13} /> 添加
                </button>
              }
            >
              {data.experience.map((item, index) => (
                <div key={item.id} className="rounded-md border border-surface-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">经历 {index + 1}</span>
                    <button type="button" onClick={() => update({ experience: data.experience.filter((entry) => entry.id !== item.id) })} className="text-xs text-accent-danger">
                      删除
                    </button>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field label="公司" value={item.company} onChange={(value) => update({ experience: data.experience.map((entry) => entry.id === item.id ? { ...entry, company: value } : entry) })} />
                    <Field label="职位" value={item.role} onChange={(value) => update({ experience: data.experience.map((entry) => entry.id === item.id ? { ...entry, role: value } : entry) })} />
                    <Field label="开始时间" value={item.startDate} onChange={(value) => update({ experience: data.experience.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry) })} placeholder="2022.07" />
                    <Field label="结束时间" value={item.endDate} onChange={(value) => update({ experience: data.experience.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry) })} placeholder="至今" />
                  </div>
                  <div className="mt-3">
                    <LineEditor
                      label="工作成果"
                      items={item.bullets}
                      onChange={(bullets) => update({ experience: data.experience.map((entry) => entry.id === item.id ? { ...entry, bullets } : entry) })}
                      placeholder="动词 + 动作 + 可量化结果"
                    />
                  </div>
                </div>
              ))}
              {!data.experience.length ? <p className="rounded bg-white/60 py-4 text-center text-xs text-ink-muted">还没有工作经历，点击右上角添加。</p> : null}
            </Collapsible>

            <Collapsible
              title="项目经历"
              icon={Layers3}
              open={openSection === "projects"}
              onToggle={() => setOpenSection(openSection === "projects" ? "" : "projects")}
              action={
                <button
                  type="button"
                  onClick={() => {
                    update({
                      projects: [
                        ...data.projects,
                        { id: createId("proj"), name: "", role: "", tech: [], startDate: "", endDate: "", bullets: [""] },
                      ],
                    });
                    setOpenSection("projects");
                  }}
                  className="btn-ghost h-7 px-2 text-xs"
                >
                  <Plus size={13} /> 添加
                </button>
              }
            >
              {data.projects.map((item, index) => (
                <div key={item.id} className="rounded-md border border-surface-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">项目 {index + 1}</span>
                    <button type="button" onClick={() => update({ projects: data.projects.filter((entry) => entry.id !== item.id) })} className="text-xs text-accent-danger">删除</button>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field label="项目名称" value={item.name} onChange={(value) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, name: value } : entry) })} />
                    <Field label="担任角色" value={item.role} onChange={(value) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, role: value } : entry) })} />
                    <Field label="开始时间" value={item.startDate} onChange={(value) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry) })} />
                    <Field label="结束时间" value={item.endDate} onChange={(value) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry) })} />
                  </div>
                  <div className="mt-3">
                    <Field label="技术 / 方法（用逗号分隔）" value={item.tech.join("，")} onChange={(value) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, tech: value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) } : entry) })} />
                  </div>
                  <div className="mt-3">
                    <LineEditor
                      label="项目成果"
                      items={item.bullets}
                      onChange={(bullets) => update({ projects: data.projects.map((entry) => entry.id === item.id ? { ...entry, bullets } : entry) })}
                      placeholder="说明你做了什么以及带来了什么结果"
                    />
                  </div>
                </div>
              ))}
            </Collapsible>

            <Collapsible
              title="教育背景"
              icon={GraduationCap}
              open={openSection === "education"}
              onToggle={() => setOpenSection(openSection === "education" ? "" : "education")}
              action={
                <button
                  type="button"
                  onClick={() => {
                    update({ education: [...data.education, { id: createId("edu"), school: "", degree: "", major: "", startDate: "", endDate: "", highlights: [] }] });
                    setOpenSection("education");
                  }}
                  className="btn-ghost h-7 px-2 text-xs"
                >
                  <Plus size={13} /> 添加
                </button>
              }
            >
              {data.education.map((item) => (
                <div key={item.id} className="rounded-md border border-surface-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">教育经历</span>
                    <button type="button" onClick={() => update({ education: data.education.filter((entry) => entry.id !== item.id) })} className="text-xs text-accent-danger">删除</button>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field label="学校" value={item.school} onChange={(value) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, school: value } : entry) })} />
                    <Field label="专业" value={item.major} onChange={(value) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, major: value } : entry) })} />
                    <Field label="学历" value={item.degree} onChange={(value) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, degree: value } : entry) })} />
                    <Field label="开始时间" value={item.startDate} onChange={(value) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry) })} />
                    <Field label="结束时间" value={item.endDate} onChange={(value) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry) })} />
                  </div>
                  <div className="mt-3">
                    <LineEditor label="在校亮点" items={item.highlights} onChange={(highlights) => update({ education: data.education.map((entry) => entry.id === item.id ? { ...entry, highlights } : entry) })} placeholder="奖学金、社团、课程项目等" />
                  </div>
                </div>
              ))}
            </Collapsible>

            <Collapsible
              title="专业技能"
              icon={WandSparkles}
              open={openSection === "skills"}
              onToggle={() => setOpenSection(openSection === "skills" ? "" : "skills")}
              action={
                <button
                  type="button"
                  onClick={() => {
                    update({ skills: [...data.skills, { id: createId("skill"), category: "", items: [] }] });
                    setOpenSection("skills");
                  }}
                  className="btn-ghost h-7 px-2 text-xs"
                >
                  <Plus size={13} /> 添加
                </button>
              }
            >
              {data.skills.map((group) => (
                <div key={group.id} className="rounded-md border border-surface-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">技能组</span>
                    <button type="button" onClick={() => update({ skills: data.skills.filter((entry) => entry.id !== group.id) })} className="text-xs text-accent-danger">删除</button>
                  </div>
                  <Field label="分类" value={group.category} onChange={(value) => update({ skills: data.skills.map((entry) => entry.id === group.id ? { ...entry, category: value } : entry) })} placeholder="例如：运营方法 / 工具" />
                  <div className="mt-3">
                    <Field label="技能（用逗号分隔）" value={group.items.join("，")} onChange={(value) => update({ skills: data.skills.map((entry) => entry.id === group.id ? { ...entry, items: value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) } : entry) })} placeholder="SQL，Tableau，Figma" />
                  </div>
                </div>
              ))}
            </Collapsible>

            <Collapsible title="证书与语言" icon={Sparkles} open={openSection === "certificates"} onToggle={() => setOpenSection(openSection === "certificates" ? "" : "certificates")}>
              <LineEditor label="证书 / 资质" items={data.certificates} onChange={(certificates) => update({ certificates })} placeholder="例如：大学英语六级" />
              <LineEditor label="语言能力" items={data.languages} onChange={(languages) => update({ languages })} placeholder="例如：英语（商务沟通）" />
            </Collapsible>

            <Collapsible
              title="自定义模块"
              icon={Layers3}
              open={openSection === "custom"}
              onToggle={() => setOpenSection(openSection === "custom" ? "" : "custom")}
              action={
                <button
                  type="button"
                  onClick={() => {
                    update({ customSections: [...data.customSections, { id: createId("custom"), title: "", bullets: [""] }] });
                    setOpenSection("custom");
                  }}
                  className="btn-ghost h-7 px-2 text-xs"
                >
                  <Plus size={13} /> 添加
                </button>
              }
            >
              {data.customSections.map((section) => (
                <div key={section.id} className="rounded-md border border-surface-line bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">自定义内容</span>
                    <button type="button" onClick={() => update({ customSections: data.customSections.filter((entry) => entry.id !== section.id) })} className="text-xs text-accent-danger">删除</button>
                  </div>
                  <Field label="模块标题" value={section.title} onChange={(value) => update({ customSections: data.customSections.map((entry) => entry.id === section.id ? { ...entry, title: value } : entry) })} />
                  <div className="mt-3">
                    <LineEditor label="内容" items={section.bullets} onChange={(bullets) => update({ customSections: data.customSections.map((entry) => entry.id === section.id ? { ...entry, bullets } : entry) })} />
                  </div>
                </div>
              ))}
            </Collapsible>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
            <span>小提示：工作成果尽量使用“负责什么 + 怎么做 + 带来什么结果”的写法。</span>
            <Link href="/analysis" className="font-medium text-primary-pine hover:underline">完成后去做一次简历诊断</Link>
          </div>
        </div>

        <div className={`${mobilePreview ? "" : "hidden lg:block"} min-w-0`}>
          <div className="print-area sticky top-[112px]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-ink-muted">A4 实时预览</span>
              <div className="flex gap-2 sm:hidden">
                <button type="button" onClick={() => window.print()} className="btn-secondary h-8 px-3 text-xs">打印 PDF</button>
              </div>
            </div>
            <div className="h-[calc(100vh-180px)] overflow-auto rounded-md bg-[#e9e5dc] p-4">
              <div className="origin-top scale-[0.72] xl:scale-[0.82]">
                <ResumePreview data={data} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}