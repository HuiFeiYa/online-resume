import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth/current-user";

export const metadata = { title: "注册" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="surface-card p-6 sm:p-8">
        <p className="eyebrow">Create account</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">创建免费账号</h1>
        <p className="mt-2 mb-6 text-sm text-ink-muted">模板下载无需登录。账号用于保存简历和使用 AI 分析。</p>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}