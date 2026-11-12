import { notFound } from "next/navigation";
import { getUserResume } from "@/lib/resume/store";
import { getTemplateById } from "@/lib/templates";
import { readResumePrintToken } from "@/lib/documents/print-token";
import ResumePreview from "@/components/resume-preview";
import { defaultTheme } from "@/lib/resume/schema";

export default async function ResumePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token = "" } = await searchParams;
  const userId = readResumePrintToken(token, id);
  if (!userId) notFound();
  const resume = await getUserResume(userId, id);
  if (!resume) notFound();
  const template = await getTemplateById(resume.templateId);

  return (
    <main className="print-page">
      <ResumePreview
        data={resume.data}
        theme={template?.theme || defaultTheme}
        rendererKey={template?.rendererKey || "classic"}
      />
    </main>
  );
}