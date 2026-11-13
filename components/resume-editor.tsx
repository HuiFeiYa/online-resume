"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Download,
  GraduationCap,
  Layers3,
  Loader2,
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
import { GUEST_DRAFT_KEY, type GuestDraft } from "@/components/new-resume-buttons";
import {
  createId,
  type ResumeData,
  type TemplateTheme,
} from "@/lib/resume/schema";
import { clearSection } from "@/lib/resume/sections";

type Props = {
  resumeId?: string;
  initialTitle: string;
  initialData: ResumeData;
  initialRevision?: number;
  theme: TemplateTheme;
  templateSlug: string;
  loggedIn: boolean;
  autoExport?: "docx" | "pdf" | null;
  rendererKey?: string;
  optimizedId?: string;
};

type SaveState = "saved" | "saving" | "dirty" | "error" | "local";

type SectionKey = keyof ResumeData["sectionVisibility"];

const sectionLabels: Array<[string, string]> = [
  ["basics", "个人信息"],
  ["skills", "专业技能"],
  ["experience", "工作经历"],
  ["projects", "项目经历"],
  ["evaluation", "个人评价"],
  ["education", "教育背景"],
  ["certificates", "证书语言"],
  ["custom", "自定义模块"],
];

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
  sectionKey,
  hidden,
  onToggleVisibility,
  onDelete,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  action?: React.ReactNode;
  sectionKey?: SectionKey;
  hidden?: boolean;
  onToggleVisibility?: () => void;
  onDelete?: () => void;
}) {
  return (
    <section className={`border-b border-surface-line/80 last:border-b-0 ${hidden ? "bg-surface-base/50" : ""}`}>
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon size={17} strokeWidth={1.7} className="text-primary-pine" />
          <span className={`text-sm font-medium ${hidden ? "text-ink-muted line-through" : "text-ink"}`}>{title}</span>
          {hidden ? <span className="rounded bg-surface-line/60 px-1.5 py-0.5 text-[10px] text-ink-muted">已隐藏</span> : null}
          {open ? <ChevronUp size={15} className="ml-auto shrink-0 text-ink-muted" /> : <ChevronDown size={15} className="ml-auto shrink-0 text-ink-muted" />}
        </button>
        {sectionKey ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="rounded px-2 py-1 text-[11px] text-ink-muted hover:bg-white hover:text-ink"
            title={hidden ? "显示模块" : "隐藏模块"}
          >
            {hidden ? "显示" : "隐藏"}
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:bg-white hover:text-accent-danger"
            title="删除整个模块"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
        {action}
      </div>
      {open ? <div className="space-y-3 px-4 pb-5">{children}</div> : null}
    </section>
  );
}

export default function ResumeEditor({
  resumeId: initialResumeId,
  initialTitle,
  initialData,
  initialRevision = 1,
  theme,
  templateSlug,
  loggedIn,
  autoExport = null,
  rendererKey = "classic",
  optimizedId,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState(initialTitle);
  const [resumeId, setResumeId] = useState(initialResumeId);
  const [revision, setRevision] = useState(initialRevision);
  const [saveState, setSaveState] = useState<SaveState>(initialResumeId ? "saved" : "local");
  const [openSection, setOpenSection] = useState<string>("basics");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<"docx" | "pdf">(
    autoExport === "pdf" ? "pdf" : "docx",
  );
  const [comingFrom, setComingFrom] = useState("/templates");
  const [showLogin, setShowLogin] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  const latestTitle = useRef(title);
  latestData.current = data;
  latestTitle.current = title;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("jianye_editor_referrer");
      if (stored && new URL(stored, window.location.origin).origin === window.location.origin) {
        setComingFrom(stored);
        return;
      }
      if (document.referrer) {
        const url = new URL(document.referrer);
        if (url.origin === window.location.origin) {
          const path = `${url.pathname}${url.search}`;
          setComingFrom(path);
          sessionStorage.setItem("jianye_editor_referrer", path);
        }
      }
    } catch {
      // Keep the template-center fallback if browser history is unavailable.
    }
  }, []);

  function goBack() {
    router.push(comingFrom || (loggedIn ? "/dashboard" : "/templates"));
  }

  const saveLocalDraft = useCallback(() => {
    const draft: GuestDraft = {
      title: latestTitle.current,
      templateSlug,
      data: latestData.current,
      updatedAt: Date.now(),
    };
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
    setSaveState("local");
  }, [templateSlug]);

  const persist = useCallback(async () => {
    if (optimizedId) {
      setSaveState("saving");
      try {
        const resp = await fetch(`/api/optimized-resumes/${optimizedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: latestData.current }),
        });
        setSaveState(resp.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
      return;
    }
    if (!resumeId) {
      saveLocalDraft();
      return;
    }
    setSaveState("saving");
    try {
      const resp = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: latestData.current, title: latestTitle.current, revision }),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        // An account draft can expire its session; retain the content locally.
        setResumeId(undefined);
        saveLocalDraft();
        return;
      }
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
  }, [resumeId, revision, saveLocalDraft, optimizedId]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, title, saveState, persist]);

  useEffect(() => {
    if (loggedIn) return;
    const timer = setTimeout(saveLocalDraft, 500);
    return () => clearTimeout(timer);
  }, [data, title, loggedIn, saveLocalDraft]);

  function update(next: Partial<ResumeData>) {
    setData((current) => ({ ...current, ...next }));
    setSaveState("dirty");
  }

  function setVisible(key: SectionKey, visible: boolean) {
    update({
      sectionVisibility: {
        ...data.sectionVisibility,
        [key]: visible,
      },
    });
  }

  function removeSection(key: SectionKey, label: string) {
    if (!window.confirm(`确定删除“${label}”模块吗？模块内容会被清空。`)) return;
    setData((current) => clearSection(current, key));
    setSaveState("dirty");
    setOpenSection("");
  }

  async function claimDraftAndExport(format: "docx" | "pdf" = pendingExportFormat): Promise<boolean> {
    try {
      const resp = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug,
          title: latestTitle.current,
          data: latestData.current,
        }),
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          setShowLogin(true);
          return false;
        }
        throw new Error("claim failed");
      }
      const body = await resp.json();
      const nextId: string = body.resume.id;
      localStorage.removeItem(GUEST_DRAFT_KEY);
      setResumeId(nextId);
      setRevision(body.resume.revision);
      setSaveState("saved");
      await downloadExport(nextId, format, body.resume.data);
      window.history.replaceState(null, "", `/editor/${nextId}`);
      router.refresh();
      return true;
    } catch {
      return false;
    }
  }

  function requestLogin(format: "docx" | "pdf" = "docx") {
    setPendingExportFormat(format);
    setExportMenuOpen(false);
    saveLocalDraft();
    setShowLogin(true);
  }

  async function downloadExport(
    id: string,
    format: "docx" | "pdf",
    fallbackData: ResumeData = latestData.current,
  ) {
    const exportUrl = optimizedId
      ? `/api/optimized-resumes/${optimizedId}/export/${format}`
      : `/api/resumes/${id}/export/${format}`;
    const resp = await fetch(exportUrl, {
      method: "POST",
      cache: "no-store",
    });
    if (resp.status === 401) {
      requestLogin(format);
      return false;
    }
    if (!resp.ok) throw new Error("export failed");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const base = [
      latestData.current.basics.name || fallbackData.basics.name || latestTitle.current || "我的简历",
      latestData.current.intention.targetRole || fallbackData.intention.targetRole || "",
      "简历",
    ].filter(Boolean).join("-");
    anchor.href = url;
    anchor.download = `${base}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  }

  const claimOnce = useRef(false);
  useEffect(() => {
    if (!autoExport || !loggedIn || resumeId || claimOnce.current) return;
    claimOnce.current = true;
    setExporting(true);
    claimDraftAndExport(pendingExportFormat).finally(() => setExporting(false));
    // The effect intentionally runs once after a guest draft has been claimed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExport, loggedIn, resumeId]);

  async function exportResume(format: "docx" | "pdf") {
    setPendingExportFormat(format);
    setExportMenuOpen(false);
    if (!loggedIn) {
      requestLogin(format);
      return;
    }
    if (!resumeId && !optimizedId) {
      setExporting(true);
      await claimDraftAndExport(format);
      setExporting(false);
      return;
    }
    setExporting(true);
    try {
      await downloadExport(resumeId || optimizedId || "", format);
    } finally {
      setExporting(false);
    }
  }

  function printResume() {
    if (!loggedIn) {
      requestLogin("pdf");
      return;
    }
    window.print();
  }

  const saveLabel =
    saveState === "saved"
      ? "已保存到账号"
      : saveState === "saving"
        ? "保存中..."
        : saveState === "dirty"
          ? loggedIn && resumeId ? "正在保存" : "正在保存草稿"
          : saveState === "local"
            ? "草稿已保存在此浏览器"
            : "保存失败";

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface-base">
      <div className="no-print sticky top-16 z-30 border-b border-surface-line bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:px-5">
          <button type="button" onClick={goBack} className="btn-ghost shrink-0 px-2">
            ← 返回
          </button>
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
            <span className={`h-1.5 w-1.5 rounded-full ${saveState === "saved" ? "bg-accent-success" : saveState === "error" ? "bg-accent-danger" : saveState === "local" ? "bg-primary-teal" : "bg-accent-warn"}`} />
            {saveLabel}
          </span>
          <button type="button" onClick={() => { setSaveState("dirty"); persist(); }} className="btn-ghost hidden sm:inline-flex">
            <Save size={15} /> 保存
          </button>
          <button type="button" onClick={() => setMobilePreview((value) => !value)} className="btn-secondary lg:hidden">
            {mobilePreview ? "编辑" : "预览"}
          </button>
          <button type="button" onClick={printResume} className="btn-secondary hidden sm:inline-flex">
            <Printer size={15} /> 打印
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((value) => !value)}
              disabled={exporting}
              className="btn-primary"
              aria-expanded={exportMenuOpen}
            >
              <Download size={15} /> {exporting ? "导出中..." : "导出"}
              <ChevronDown size={14} />
            </button>
            {exporting ? (
              <div className="absolute right-0 top-12 z-50 flex w-64 items-center gap-2 rounded-md border border-surface-line bg-white px-3 py-2 text-xs text-ink-muted shadow-xl">
                <Loader2 size={14} className="animate-spin text-primary-pine" />
                正在生成 {pendingExportFormat === "pdf" ? "PDF" : "Word"} 文件...
              </div>
            ) : null}
            {exportMenuOpen ? (
              <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-md border border-surface-line bg-white py-1 shadow-xl">
                <button type="button" onClick={() => exportResume("docx")} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-base">导出 Word (.docx)</button>
                <button type="button" onClick={() => exportResume("pdf")} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-base">导出 PDF (.pdf)</button>
                <button type="button" onClick={() => { setExportMenuOpen(false); printResume(); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-base">浏览器打印</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {exporting ? (
        <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-ink/35 p-4">
          <div className="flex min-w-64 items-center gap-3 rounded-lg border border-surface-line bg-white px-5 py-4 shadow-2xl">
            <Loader2 size={20} className="animate-spin text-primary-pine" />
            <div>
              <p className="text-sm font-medium text-ink">导出中...</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                正在生成 {pendingExportFormat === "pdf" ? "PDF" : "Word"} 文件，请稍候
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showLogin ? (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4">
          <div className="w-full max-w-sm rounded-lg border border-surface-line bg-white p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-ink">登录后导出简历</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              你刚才填写的内容已经保存在这个浏览器里。登录后台会自动保存到你的账号，并立即开始导出。
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(`/editor/draft?export=${pendingExportFormat}`)}`}
                className="btn-primary w-full"
              >
                登录并继续导出
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(`/editor/draft?export=${pendingExportFormat}`)}`}
                className="btn-secondary w-full"
              >
                创建账号
              </Link>
              <button type="button" onClick={() => setShowLogin(false)} className="btn-ghost w-full">
                继续编辑
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <Collapsible title="个人信息" icon={UserRound} open={openSection === "basics"} onToggle={() => setOpenSection(openSection === "basics" ? "" : "basics")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="姓名" value={data.basics.name} onChange={(value) => update({ basics: { ...data.basics, name: value } })} placeholder="你的姓名" />
                <Field label="性别" value={data.basics.gender} onChange={(value) => update({ basics: { ...data.basics, gender: value } })} placeholder="例如：男 / 女" />
                <Field label="出生年月" value={data.basics.birthDate} onChange={(value) => update({ basics: { ...data.basics, birthDate: value } })} placeholder="例如：1999.08" />
                <Field label="工作年限" value={data.basics.yearsExperience} onChange={(value) => update({ basics: { ...data.basics, yearsExperience: value } })} placeholder="例如：3 年" />
                <Field label="手机" value={data.basics.phone} onChange={(value) => update({ basics: { ...data.basics, phone: value } })} placeholder="138 0000 0000" />
                <Field label="邮箱" value={data.basics.email} onChange={(value) => update({ basics: { ...data.basics, email: value } })} placeholder="you@example.com" />
                <Field label="毕业院校" value={data.basics.school} onChange={(value) => update({ basics: { ...data.basics, school: value } })} placeholder="例如：华东理工大学" />
                <Field label="学历" value={data.basics.degree} onChange={(value) => update({ basics: { ...data.basics, degree: value } })} placeholder="例如：本科" />
                <Field label="所在城市" value={data.basics.city} onChange={(value) => update({ basics: { ...data.basics, city: value } })} placeholder="例如：上海" />
                <Field label="微信" value={data.basics.wechat} onChange={(value) => update({ basics: { ...data.basics, wechat: value } })} placeholder="选填" />
              </div>
              <div className="grid gap-3 border-t border-surface-line/70 pt-3 sm:grid-cols-2">
                <Field label="求职意向" value={data.intention.targetRole} onChange={(value) => update({ intention: { ...data.intention, targetRole: value } })} placeholder="例如：用户增长经理" />
                <Field label="期望城市" value={data.intention.targetCity} onChange={(value) => update({ intention: { ...data.intention, targetCity: value } })} placeholder="例如：上海" />
                <Field label="期望薪资" value={data.intention.salary} onChange={(value) => update({ intention: { ...data.intention, salary: value } })} placeholder="选填" />
                <Field label="到岗时间" value={data.intention.availability} onChange={(value) => update({ intention: { ...data.intention, availability: value } })} placeholder="例如：一个月内" />
              </div>
            </Collapsible>

            <Collapsible
              title="专业技能"
              icon={WandSparkles}
              open={openSection === "skills"}
              onToggle={() => setOpenSection(openSection === "skills" ? "" : "skills")}
              sectionKey="skills"
              hidden={!data.sectionVisibility.skills}
              onToggleVisibility={() => setVisible("skills", !data.sectionVisibility.skills)}
              onDelete={() => removeSection("skills", "专业技能")}
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

            <Collapsible
              title="工作经历"
              icon={BriefcaseBusiness}
              open={openSection === "experience"}
              onToggle={() => setOpenSection(openSection === "experience" ? "" : "experience")}
              sectionKey="experience"
              hidden={!data.sectionVisibility.experience}
              onToggleVisibility={() => setVisible("experience", !data.sectionVisibility.experience)}
              onDelete={() => removeSection("experience", "工作经历")}
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
              sectionKey="projects"
              hidden={!data.sectionVisibility.projects}
              onToggleVisibility={() => setVisible("projects", !data.sectionVisibility.projects)}
              onDelete={() => removeSection("projects", "项目经历")}
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

            <Collapsible title="个人评价" icon={Sparkles} open={openSection === "evaluation"} onToggle={() => setOpenSection(openSection === "evaluation" ? "" : "evaluation")} sectionKey="evaluation" hidden={!data.sectionVisibility.evaluation} onToggleVisibility={() => setVisible("evaluation", !data.sectionVisibility.evaluation)} onDelete={() => removeSection("evaluation", "个人评价")}>
              <Field label="个人优势 / 自我评价" value={data.evaluation} onChange={(value) => update({ evaluation: value })} placeholder="概括你的核心能力、擅长的业务、工作方式和职业目标。" textarea />
            </Collapsible>

            <Collapsible
              title="教育背景"
              icon={GraduationCap}
              open={openSection === "education"}
              onToggle={() => setOpenSection(openSection === "education" ? "" : "education")}
              sectionKey="education"
              hidden={!data.sectionVisibility.education}
              onToggleVisibility={() => setVisible("education", !data.sectionVisibility.education)}
              onDelete={() => removeSection("education", "教育背景")}
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
              title="证书与语言"
              icon={Sparkles}
              open={openSection === "certificates"}
              onToggle={() => setOpenSection(openSection === "certificates" ? "" : "certificates")}
              sectionKey="certificates"
              hidden={!data.sectionVisibility.certificates || !data.sectionVisibility.languages}
              onToggleVisibility={() => {
                const visible = !(data.sectionVisibility.certificates || data.sectionVisibility.languages);
                update({
                  sectionVisibility: {
                    ...data.sectionVisibility,
                    certificates: visible,
                    languages: visible,
                  },
                });
              }}
              onDelete={() => {
                if (!window.confirm("确定删除“证书与语言”模块吗？模块内容会被清空。")) return;
                setData((current) => ({
                  ...clearSection(
                    clearSection(current, "certificates"),
                    "languages",
                  ),
                  sectionVisibility: {
                    ...current.sectionVisibility,
                    certificates: false,
                    languages: false,
                  },
                }));
                setSaveState("dirty");
                setOpenSection("");
              }}
            >
              <LineEditor label="证书 / 资质" items={data.certificates} onChange={(certificates) => update({ certificates })} placeholder="例如：大学英语六级" />
              <LineEditor label="语言能力" items={data.languages} onChange={(languages) => update({ languages })} placeholder="例如：英语（商务沟通）" />
            </Collapsible>

            <Collapsible
              title="自定义模块"
              icon={Layers3}
              open={openSection === "custom"}
              onToggle={() => setOpenSection(openSection === "custom" ? "" : "custom")}
              sectionKey="custom"
              hidden={!data.sectionVisibility.custom}
              onToggleVisibility={() => setVisible("custom", !data.sectionVisibility.custom)}
              onDelete={() => removeSection("custom", "自定义模块")}
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
                <button type="button" onClick={printResume} className="btn-secondary h-8 px-3 text-xs">打印 PDF</button>
              </div>
            </div>
            <div className="h-[calc(100vh-180px)] overflow-auto rounded-md bg-[#e9e5dc] p-4">
              <div className="origin-top scale-[0.72] xl:scale-[0.82]">
                <ResumePreview data={data} theme={theme} rendererKey={rendererKey} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}