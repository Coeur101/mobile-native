import { expect, test } from "@playwright/test";

test("未登录用户会进入 OTP-only 登录页并可切换登录路径", async ({ page }) => {
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
  await expect(page.getByRole("heading", { name: "邮箱验证码登录" })).toBeVisible();
  await expect(page.getByTestId("entry-mode-login")).toBeVisible();
  await expect(page.getByTestId("entry-mode-register")).toBeVisible();
  await expect(page.getByTestId("request-login-otp")).toBeVisible();
  await expect(page.getByTestId("entry-mode-reset_request")).toHaveCount(0);

  await page.getByTestId("entry-mode-register").click();
  await expect(page.getByTestId("request-register-otp")).toBeVisible();
  await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  await expect(page.getByText("注册成功后会自动生成默认昵称与头像。")).toBeVisible();
  await expect(page.getByTestId("entry-mode-reset_request")).toHaveCount(0);
});