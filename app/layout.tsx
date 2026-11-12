import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "简页 - 免费简历模板与 AI 求职工具",
    template: "%s | 简页",
  },
  description:
    "免费下载简历模板，在线制作简历，获取 AI 简历评分、JD 匹配分析和求职咨询。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}