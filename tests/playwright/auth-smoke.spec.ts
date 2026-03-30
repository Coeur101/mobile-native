import { expect, test } from "@playwright/test";

test("未登录用户会进入中文登录页并可切换登录路径", async ({ page }) => {
  await page.addInitScript(() => {
    (
      window as typeof window & {
        __APP_SUPABASE_MOCK__?: {
          auth: {
            getSession: () => Promise<{ data: { session: null }; error: null }>;
            onAuthStateChange: () => {
              data: { subscription: { unsubscribe: () => void } };
            };
          };
        };
      }
    ).__APP_SUPABASE_MOCK__ = {
      auth: {
        getSession: async () => ({
          data: { session: null },
          error: null,
        }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }),
      },
    };
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "登录账号" })).toBeVisible();
  await expect(page.getByTestId("entry-mode-login")).toBeVisible();
  await expect(page.getByTestId("entry-mode-register")).toBeVisible();
  await expect(page.getByTestId("login-method-otp")).toBeVisible();
  await expect(page.getByTestId("login-method-password")).toBeVisible();
  await expect(page.getByTestId("request-login-otp")).toBeVisible();
  await expect(page.getByTestId("entry-mode-reset_request")).toHaveCount(0);

  await page.getByTestId("login-method-password").click();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByTestId("login-with-password")).toBeVisible();
  await expect(page.getByTestId("request-password-reset")).toBeVisible();

  await page.getByTestId("login-method-otp").click();
  await expect(page.getByTestId("request-login-otp")).toBeVisible();

  await page.getByTestId("entry-mode-register").click();
  await expect(page.getByRole("heading", { name: "注册账号" })).toBeVisible();
  await expect(page.getByTestId("request-register-otp")).toBeVisible();
  await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  await expect(page.getByText("注册成功后会自动生成默认昵称与头像。")).toHaveCount(0);
  await expect(page.getByTestId("entry-mode-reset_request")).toHaveCount(0);
});
