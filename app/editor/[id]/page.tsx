import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/current-user";
import { getUserResume } from "@/lib/resume/store";
import { getTemplateById } from "@/lib/templates";
import ResumeEditor from "@/components/resume-editor";
import { defaultTheme } from "@/lib/resume/schema";

export const metadata = { title: "编辑简历" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/editor/${id}`)}`);
  const resume = await getUserResume(user.id, id);
  if (!resume) notFound();
  const template = await getTemplateById(resume.templateId);
  return (
    <ResumeEditor
      resumeId={resume.id}
      initialTitle={resume.title}
      initialData={resume.data}
      initialRevision={resume.revision}
      theme={template?.theme || defaultTheme}
    />
  );
}