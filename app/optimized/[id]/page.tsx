import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/current-user";
import { getOptimizedResume } from "@/lib/analysis/optimized-store";
import { getTemplateBySlug } from "@/lib/templates";
import { defaultTheme } from "@/lib/resume/schema";
import OptimizedResumeViewer from "@/components/optimized-resume-viewer";

export const metadata = { title: "优化版简历" };

export default async function OptimizedResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/optimized/${id}`)}`);
  const optimized = await getOptimizedResume(user.id, id);
  if (!optimized) notFound();
  const template = await getTemplateBySlug("forest-editorial");

  return (
    <OptimizedResumeViewer
      id={optimized.id}
      title={optimized.title}
      data={optimized.data}
      changes={optimized.changes}
      theme={template?.theme || defaultTheme}
      rendererKey={template?.rendererKey || "classic"}
      templateSlug={template?.slug || "forest-editorial"}
    />
  );
}