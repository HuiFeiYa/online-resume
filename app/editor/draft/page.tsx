import GuestDraftEditor from "@/components/guest-draft-editor";
import { getSessionUser } from "@/lib/auth/current-user";

export const metadata = { title: "在线制作简历" };

export default async function DraftEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  const exportFormat = params.export === "pdf" ? "pdf" : params.export === "docx" || params.export === "1" ? "docx" : null;
  return (
    <GuestDraftEditor
      loggedIn={Boolean(user)}
      autoExport={Boolean(user) ? exportFormat : null}
    />
  );
}