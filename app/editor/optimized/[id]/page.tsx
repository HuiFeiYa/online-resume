import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/current-user";
import { getOptimizedResume } from "@/lib/analysis/optimized-store";
import { getTemplateBySlug } from "@/lib/templates";
import { defaultTheme } from "@/lib/resume/schema";
import ResumeEditor from "@/components/resume-editor";

export const metadata = { title: "编辑优化版简历" };

export default async function OptimizedEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/editor/optimized/${id}`)}`);
  const optimized = await getOptimizedResume(user.id, id);
  if (!optimized) notFound();
  const template = await getTemplateBySlug("forest-editorial");

  return (
    <ResumeEditor
      initialTitle={optimized.title}
      initialData={optimized.data}
      theme={template?.theme || defaultTheme}
      templateSlug={template?.slug || "forest-editorial"}
      loggedIn
      rendererKey={template?.rendererKey || "classic"}
      optimizedId={optimized.id}
    />
  );
}