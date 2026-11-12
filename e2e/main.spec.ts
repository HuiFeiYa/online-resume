import { expect, test } from "@playwright/test";

test("home and template catalog render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("从一份好简历开始");
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "免费简历模板" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("catalog only shows real editable templates", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByText("共 8 个模板")).toBeVisible();
  await expect(page.getByRole("heading", { name: "松林双栏" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "朱砂单栏" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "互联网极简" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "技术时间线" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "灰块分区版" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "蓝色重点版" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "紧凑一页版" })).toBeVisible();
  await expect(page.getByText("产品经理聚焦版")).toHaveCount(0);
});

test("template detail uses the same editable layout as the catalog", async ({ page }) => {
  await page.goto("/templates/forest-editorial");
  await expect(page.getByRole("heading", { name: "松林双栏" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "个人信息", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "使用此模板在线填写" })).toHaveAttribute(
    "href",
    "/editor/start?template=forest-editorial",
  );
});

test("template download returns docx and pdf", async ({ request }) => {
  const response = await request.get("/api/templates/forest-editorial/download");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  const body = await response.body();
  expect(body.length).toBeGreaterThan(1000);
  expect(body.subarray(0, 2).toString()).toBe("PK");

  const pdf = await request.get("/api/templates/forest-editorial/download/pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("guest edits locally and is asked to log in on export", async ({ page }) => {
  await page.goto("/editor/new");
  await page.getByRole("button", { name: "使用此模板" }).first().click();
  await expect(page).toHaveURL(/\/editor\/draft/);
  await expect(page.getByText("草稿已保存在此浏览器")).toBeVisible();
  await page.getByLabel("姓名").fill("游客测试");
  await page.getByRole("button", { name: "导出 Word" }).click();
  await expect(page.getByRole("heading", { name: "登录后导出简历" })).toBeVisible();

  const username = `user${Date.now()}`;
  await page.getByRole("link", { name: "创建账号" }).click();
  await page.getByLabel("昵称").fill(username);
  await page.getByLabel("密码").fill("password123");
  await page.getByRole("button", { name: "免费注册" }).click();
  await expect(page).toHaveURL(/\/editor\/r-/, { timeout: 20000 });
  await expect(page.getByText("已保存到账号")).toBeVisible({ timeout: 15000 });
});

test("consultation requires only basic fields", async ({ page }) => {
  await page.goto("/consult");
  await page.getByLabel("怎么称呼你").fill("小王");
  await page.getByLabel("账号 / 号码").fill("wx-test-123");
  await page.getByRole("button", { name: "提交免费咨询" }).click();
  await expect(page.getByText("已收到你的咨询")).toBeVisible();
});