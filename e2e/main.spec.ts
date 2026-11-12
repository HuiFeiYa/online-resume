import { expect, test } from "@playwright/test";

test("home and template catalog render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("从一份好简历开始");
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "免费简历模板" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("template download returns a docx", async ({ request }) => {
  const response = await request.get("/api/templates/forest-editorial/download");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  const body = await response.body();
  expect(body.length).toBeGreaterThan(1000);
  expect(body.subarray(0, 2).toString()).toBe("PK");
});

test("register, create resume and autosave", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("昵称").fill("测试用户");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill("password123");
  await page.getByRole("button", { name: "免费注册" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/editor/new");
  await page.getByRole("button", { name: "使用此模板" }).first().click();
  await expect(page).toHaveURL(/\/editor\/r-/);
  const name = page.getByLabel("姓名");
  await name.fill("林测试");
  await expect(page.getByText("已保存")).toBeVisible({ timeout: 5000 });
});

test("consultation requires only basic fields", async ({ page }) => {
  await page.goto("/consult");
  await page.getByLabel("怎么称呼你").fill("小王");
  await page.getByLabel("账号 / 号码").fill("wx-test-123");
  await page.getByRole("button", { name: "提交免费咨询" }).click();
  await expect(page.getByText("已收到你的咨询")).toBeVisible();
});