export const RENDERER_LABELS: Record<string, string> = {
  sidebar: "左侧信息栏",
  classic: "经典单栏",
  minimal: "项目优先双列",
  ats: "纯文本 ATS",
  timeline: "技术时间线",
  banded: "灰块分区",
  blue: "蓝色重点",
  compact: "紧凑一页",
};

export function rendererLabel(key: string): string {
  return RENDERER_LABELS[key] || "ATS 纯文本";
}