import puppeteer, { type Browser } from "puppeteer-core";

let sharedBrowser: Browser | null = null;

const localCandidates = [
  process.env.CHROME_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean) as string[];

async function resolveExecutable(): Promise<string> {
  const { existsSync } = await import("node:fs");
  for (const candidate of localCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  const chromium = await import("@sparticuz/chromium");
  return chromium.default.executablePath();
}

export async function getBrowser(): Promise<Browser> {
  if (sharedBrowser?.connected) return sharedBrowser;
  const executablePath = await resolveExecutable();
  sharedBrowser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });
  return sharedBrowser;
}

export async function renderPrintUrlToPdf(url: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (response && !response.ok()) {
      throw new Error(`PRINT_PAGE_HTTP_${response.status()}`);
    }

    const finalUrl = new URL(page.url());
    if (finalUrl.pathname.startsWith("/login")) {
      throw new Error("PRINT_PAGE_REDIRECTED_TO_LOGIN");
    }

    await page.waitForSelector(".resume-paper", {
      timeout: 15_000,
      visible: true,
    });

    const pageText = await page.$eval("body", (element) => element.textContent || "");
    if (/登录简页|还没有账号|请输入你的昵称/.test(pageText)) {
      throw new Error("PRINT_PAGE_IS_LOGIN");
    }
    if (!pageText.trim()) {
      throw new Error("PRINT_PAGE_IS_EMPTY");
    }

    await page.emulateMediaType("print");
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await page.close();
  }
}