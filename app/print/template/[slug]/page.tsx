import { notFound } from "next/navigation";
import { getTemplateBySlug } from "@/lib/templates";
import { createShowcaseResume } from "@/lib/resume/showcase";
import ResumePreview from "@/components/resume-preview";

export default async function TemplatePrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) notFound();
  return (
    <main className="print-page">
      <ResumePreview
        data={createShowcaseResume(template.id)}
        theme={template.theme}
        rendererKey={template.rendererKey}
      />
    </main>
  );
}