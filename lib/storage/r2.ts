/** Cloudflare R2 上传服务：S3 兼容协议 + AWS Signature V4（零依赖，仅用 Web Crypto） */

export interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
}

export function getR2Config(): R2Config {
  const accountId =
    process.env.R2_ACCOUNT_ID || "00000000000000000000000000000000";
  return {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    accountId,
    bucket: process.env.R2_BUCKET || "next-starter",
    endpoint:
      process.env.R2_ENDPOINT ||
      `https://${accountId}.r2.cloudflarestorage.com`,
    publicBaseUrl:
      process.env.R2_PUBLIC_BASE_URL ||
      `https://pub-${accountId}.r2.dev`,
  };
}

export function isR2Configured(): boolean {
  const cfg = getR2Config();
  return !!(cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return toHex(digest);
}

async function hmacSha256(
  key: ArrayBuffer | string,
  message: string,
): Promise<ArrayBuffer> {
  const keyBytes =
    typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );
}

/** 下载图片字节（支持 data URL 与普通 URL） */
export async function downloadImage(
  url: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)[;,]/);
    const b64 = url.slice(url.indexOf(",") + 1);
    const bytes = Uint8Array.from(Buffer.from(b64, "base64"));
    return { bytes, contentType: match?.[1] || "image/png" };
  }

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`下载图片失败 (${resp.status})`);
  }
  const bytes = new Uint8Array(await resp.arrayBuffer());
  const contentType = resp.headers.get("content-type") || "image/png";
  return { bytes, contentType };
}

async function signRequest(
  method: string,
  bucket: string,
  safeKey: string,
  host: string,
  headers: Record<string, string>,
  payloadHash: string,
): Promise<string> {
  const cfg = getR2Config();
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timestamp = `${date}T${now
    .toISOString()
    .slice(11, 19)
    .replace(/:/g, "")}Z`;
  const region = "auto";
  const service = "s3";

  const signedHeaders = Object.keys(headers).join(";");
  const canonicalHeaders =
    Object.entries(headers)
      .map(([k, v]) => `${k}:${v}`)
      .join("\n") + "\n";

  const canonicalUri = `/${bucket}/${safeKey}`;
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timestamp,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  return `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function encodeKey(key: string): string {
  return key
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

/** 上传对象到 R2，返回公网 URL */
export async function putObject(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const cfg = getR2Config();
  if (!cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error("R2 密钥未配置（R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY）");
  }

  const host = new URL(cfg.endpoint).host;
  const safeKey = encodeKey(key);
  const payloadHash = await sha256Hex(bytes);
  const authorization = await signRequest(
    "PUT",
    cfg.bucket,
    safeKey,
    host,
    {
      "content-type": contentType,
      host,
      "x-amz-content-sha256": payloadHash,
    },
    payloadHash,
  );

  const resp = await fetch(`${cfg.endpoint}/${cfg.bucket}/${safeKey}`, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
    },
    body: bytes as unknown as BodyInit,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`R2 上传失败 (${resp.status}): ${errText.slice(0, 200)}`);
  }

  return `${cfg.publicBaseUrl.replace(/\/+$/, "")}/${safeKey}`;
}

/** 删除 R2 对象（404 视为成功） */
export async function deleteObject(key: string): Promise<void> {
  const cfg = getR2Config();
  if (!cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error("R2 密钥未配置（R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY）");
  }

  const host = new URL(cfg.endpoint).host;
  const safeKey = encodeKey(key);
  const emptyHash = await sha256Hex(new TextEncoder().encode(""));
  const authorization = await signRequest(
    "DELETE",
    cfg.bucket,
    safeKey,
    host,
    {
      host,
      "x-amz-content-sha256": emptyHash,
    },
    emptyHash,
  );

  const resp = await fetch(`${cfg.endpoint}/${cfg.bucket}/${safeKey}`, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": emptyHash,
    },
  });

  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`R2 删除失败 (${resp.status}): ${errText.slice(0, 200)}`);
  }
}
