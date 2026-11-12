import {
  createDemoResume,
  normalizeResumeData,
  type ResumeData,
} from "@/lib/resume/schema";

const profiles: Array<DeepPartial<ResumeData>> = [
  {
    basics: {
      name: "林知夏",
      jobTitle: "产品运营",
      gender: "女",
      birthDate: "1999.08",
      yearsExperience: "3 年",
      phone: "138 0000 1234",
      email: "zhixia@example.com",
      wechat: "zhixia_note",
      city: "上海",
      school: "华东理工大学",
      degree: "本科",
      website: "",
      photoUrl: "",
    },
    intention: {
      targetRole: "产品运营 / 用户增长",
      targetCity: "上海",
      salary: "面议",
      availability: "一个月内",
    },
    evaluation:
      "具备用户增长、活动运营和数据分析经验，能够从用户反馈与业务数据中定位问题，推动跨团队协作落地。",
  },
  {
    basics: {
      name: "周明远",
      jobTitle: "财务分析师",
      gender: "男",
      birthDate: "1996.03",
      yearsExperience: "5 年",
      phone: "139 0000 5678",
      email: "mingyuan@example.com",
      city: "杭州",
      school: "浙江财经大学",
      degree: "本科",
    },
    intention: {
      targetRole: "财务分析 / 经营分析",
      targetCity: "杭州",
      salary: "面议",
      availability: "两周内",
    },
    evaluation:
      "熟悉预算、成本、经营分析与审计配合，擅长将复杂数据整理成管理层可读的经营结论。",
  },
];

type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export function createShowcaseResume(seed: string): ResumeData {
  const base = createDemoResume();
  const numeric = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const profile = profiles[numeric % profiles.length];
  return normalizeResumeData({
    ...base,
    ...profile,
    basics: { ...base.basics, ...profile.basics },
    intention: { ...base.intention, ...profile.intention },
  });
}