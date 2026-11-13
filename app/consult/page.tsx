import { ArrowUpRight, MessageCircle, QrCode, Users } from "lucide-react";

const WECHAT_QR_URL =
  "https://pub-dda87fa7c11d45d78b76efe76effef5f.r2.dev/admin/material/mung30rq-aik45b21.png";

export const metadata = { title: "免费咨询" };

export default function ConsultPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
        <div>
          <p className="eyebrow">Consultation</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            免费咨询与求职交流
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
            如果你不确定简历该从哪里改、投递方向是否合适，或者想和其他求职者交流经验，可以扫码加入求职交流群。
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <article className="surface-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-pine/10 text-primary-pine">
                <Users size={20} />
              </span>
              <h2 className="mt-4 font-semibold text-ink">加入求职交流群</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                分享岗位信息、简历经验和求职进度，群内会不定期整理公开资料。
              </p>
            </article>
            <article className="surface-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-pine/10 text-primary-pine">
                <MessageCircle size={20} />
              </span>
              <h2 className="mt-4 font-semibold text-ink">群内交流</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                遇到简历、面试或岗位选择问题时，可以在群里和其他求职者交流。
              </p>
            </article>
          </div>

          <div className="mt-5 rounded-lg border border-surface-line bg-primary-pine/5 p-5">
            <p className="text-sm font-medium text-ink">扫码后可以做什么</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink-muted">
              <li>查看群内分享的求职资料和岗位信息。</li>
              <li>和其他求职者交流简历修改与面试准备经验。</li>
              <li>参与群内公开的求职讨论。</li>
            </ul>
          </div>
        </div>

        <aside className="surface-card p-5 text-center sm:p-7">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-pine/10 text-primary-pine">
            <QrCode size={22} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">扫码加入求职交流群</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">使用微信扫描下方二维码。</p>

          <div className="mt-5 rounded-lg border border-surface-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WECHAT_QR_URL}
              alt="求职交流群微信二维码"
              className="mx-auto aspect-square w-full max-w-[340px] object-contain"
            />
          </div>

          <p className="mt-3 text-xs text-ink-muted">
            二维码失效时，请稍后再试
          </p>

          <a
            href={WECHAT_QR_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary mt-5 w-full"
          >
            查看大图 <ArrowUpRight size={15} />
          </a>
        </aside>
      </section>
    </main>
  );
}