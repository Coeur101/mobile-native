import { expect, test } from "@playwright/test";

test("未登录用户会进入登录页并可切换登录方式", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await expect(page.getByTestId("entry-mode-login")).toBeVisible();
  await expect(page.getByTestId("login-method-otp")).toBeVisible();

  await page.getByTestId("login-method-password").click();
  await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible();

  await page.getByTestId("entry-mode-register").click();
  await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
});
