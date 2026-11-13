import { notFound } from "next/navigation";
import { getOptimizedResume } from "@/lib/analysis/optimized-store";
import { getTemplateBySlug } from "@/lib/templates";
import { readResumePrintToken } from "@/lib/documents/print-token";
import ResumePreview from "@/components/resume-preview";
import { defaultTheme } from "@/lib/resume/schema";

export default async function OptimizedResumePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; template?: string }>;
}) {
  const { id } = await params;
  const { token = "", template: slug = "forest-editorial" } = await searchParams;
  const userId = readResumePrintToken(token, id, "optimized");
  if (!userId) notFound();
  const optimized = await getOptimizedResume(userId, id);
  if (!optimized) notFound();
  const template = await getTemplateBySlug(slug);

  return (
    <main className="print-page">
      <ResumePreview
        data={optimized.data}
        theme={template?.theme || defaultTheme}
        rendererKey={template?.rendererKey || "classic"}
      />
    </main>
  );
}