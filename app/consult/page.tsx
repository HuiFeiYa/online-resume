import { MessageCircle, QrCode, Users } from "lucide-react";
import ConsultationForm from "@/components/consultation-form";

export const metadata = { title: "免费咨询" };

export default function ConsultPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
        <div>
          <p className="eyebrow">Consultation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">免费咨询与求职交流</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
            如果你不确定简历该从哪里改、投递方向是否合适，或者想和其他求职者交流经验，可以通过下面的方式联系我们。
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-5">
              <Users size={22} className="text-primary-pine" />
              <h2 className="mt-3 font-semibold text-ink">加入求职交流群</h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">分享岗位信息、简历经验和求职进度，群内会不定期整理公开资料。</p>
            </div>
            <div className="surface-card p-5">
              <MessageCircle size={22} className="text-primary-pine" />
              <h2 className="mt-3 font-semibold text-ink">一对一免费咨询</h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">提交你的问题和联系方式，我们会根据简历和岗位给出具体建议。</p>
            </div>
          </div>

          <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-lg border border-surface-line bg-white p-8 text-center">
            <div className="grid h-40 w-40 place-items-center rounded-md border border-dashed border-surface-line bg-surface-base">
              <QrCode size={64} strokeWidth={1.2} className="text-primary-pine/70" />
            </div>
            <p className="mt-4 text-sm font-medium text-ink">求职交流群二维码</p>
            <p className="mt-1 text-xs text-ink-muted">管理员可在配置中替换为企业微信或群二维码图片。</p>
          </div>
        </div>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-ink">留下你的问题</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">不必写得很完整，先把目前最困扰你的问题告诉我们就行。</p>
          <ConsultationForm />
        </aside>
      </div>
    </main>
  );
}