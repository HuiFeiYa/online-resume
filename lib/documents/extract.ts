import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function extractDocumentText(
  bytes: Uint8Array,
  fileName: string,
): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return normalizeText(result.value);
  }
  if (lower.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: true });
    return normalizeText(result.text);
  }
  throw new Error("UNSUPPORTED_FILE");
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectFileKind(bytes: Uint8Array, fileName: string): "docx" | "pdf" | null {
  const lower = fileName.toLowerCase();
  if (
    lower.endsWith(".docx") &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b
  ) {
    return "docx";
  }
  if (
    lower.endsWith(".pdf") &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "pdf";
  }
  return null;
}