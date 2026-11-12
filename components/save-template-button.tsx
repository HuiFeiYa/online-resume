"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

export default function SaveTemplateButton({
  templateId,
  initialSaved,
  loggedIn,
}: {
  templateId: string;
  initialSaved: boolean;
  loggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(initialSaved), [initialSaved]);

  async function toggle() {
    if (!loggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    try {
      const resp = await fetch(`/api/saved-templates/${templateId}`, {
        method: saved ? "DELETE" : "POST",
      });
      if (resp.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (resp.ok) setSaved(!saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="btn-secondary">
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      {saved ? "已收藏" : "收藏模板"}
    </button>
  );
}