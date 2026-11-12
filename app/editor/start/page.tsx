import { notFound } from "next/navigation";
import StartGuestDraft from "@/components/start-guest-draft";
import { getTemplateBySlug } from "@/lib/templates";

export default async function StartDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: slug } = await searchParams;
  const template = await getTemplateBySlug(slug || "forest-editorial");
  if (!template) notFound();
  return <StartGuestDraft templateSlug={template.slug} />;
}