import { putObject, isR2Configured } from "@/lib/storage/r2";
import { NextRequest, NextResponse } from "next/server";

// R2 上传依赖 Node 原生 crypto，需 Node 运行时
export const runtime = "nodejs";

/**
 * 最小示例：接收 multipart/form-data 的 file 字段，上传到 R2，返回公网 URL。
 * 未配置 R2 时返回 503 并提示如何配置。
 */
export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "R2 未配置，请在 .env.local 设置 R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET" },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = `uploads/${Date.now()}-${file.name}`;
  const url = await putObject(
    key,
    bytes,
    file.type || "application/octet-stream",
  );

  return NextResponse.json({ url });
}
