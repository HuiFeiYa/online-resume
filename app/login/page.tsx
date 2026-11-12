import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth/current-user";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="surface-card p-6 sm:p-8">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">登录简页</h1>
        <p className="mt-2 mb-6 text-sm text-ink-muted">登录后可保存简历、收藏模板并查看分析报告。</p>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}