import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/current-user";
import { getUserResumes } from "@/lib/resume/store";
import JdMatcher from "@/components/jd-matcher";
import { CheckCircle2, SearchCheck, Target } from "lucide-react";

export const metadata = { title: "JD 匹配" };

export default async function MatchPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/match");
  const resumes = await getUserResumes(user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_480px]">
        <div>
          <p className="eyebrow">Job match</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">JD 匹配打分</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
            用目标岗位的要求逐项对照你的简历，找出已具备的证据、只体现了一部分的能力，以及需要补充的关键词和经历。
          </p>

          <div className="mt-7 space-y-3">
            {[
              { icon: SearchCheck, title: "逐项对照", text: "把 JD 拆成硬性要求、技能、经验、学历等要求。" },
              { icon: Target, title: "解释分数", text: "不只给一个百分比，而是列出每条要求的判断依据。" },
              { icon: CheckCircle2, title: "给出下一步", text: "告诉你哪些内容需要补充，哪些已经可以保留。" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-surface-line bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-pine/10 text-primary-pine">
                  <item.icon size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-ink">开始匹配</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">选择一份在线简历，再粘贴目标岗位。</p>
          <JdMatcher
            resumes={resumes.map((resume) => ({
              id: resume.id,
              title: resume.title,
              name: resume.data.basics.name,
            }))}
            loggedIn
          />
        </aside>
      </div>
    </main>
  );
}