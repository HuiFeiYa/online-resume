"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      title="退出登录"
      aria-label="退出登录"
      className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-card hover:text-ink"
    >
      <LogOut size={15} />
    </button>
  );
}