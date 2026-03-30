import { expect, test } from "@playwright/test";

test("authenticated user can update nickname from profile and open advanced settings", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const session = {
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      expires_at: 1_900_000_000,
      token_type: "bearer",
      user: {
        id: "user-1",
        email: "demo@example.com",
        user_metadata: {
          full_name: "Demo User",
          avatar_base64:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDk2IDk2Ij48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIyOCIgZmlsbD0iIzBGQTI1QSIvPjx0ZXh0IHg9IjQ4IiB5PSI1NiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RFU8L3RleHQ+PC9zdmc+",
          has_password: false,
          profile_email: "demo@example.com",
          profile_updated_at: "2026-03-27T09:10:00.000Z",
        },
        email_confirmed_at: "2026-03-27T09:00:00.000Z",
        last_sign_in_at: "2026-03-27T09:00:00.000Z",
        updated_at: "2026-03-27T09:10:00.000Z",
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-03-27T08:00:00.000Z",
      },
    };

    (
      window as typeof window & {
        __APP_SUPABASE_MOCK__?: {
          auth: {
            getSession: () => Promise<{ data: { session: typeof session }; error: null }>;
            onAuthStateChange: () => {
              data: { subscription: { unsubscribe: () => void } };
            };
            updateUser: ({
              data,
            }: {
              data: Record<string, unknown>;
            }) => Promise<{ data: { user: typeof session.user }; error: null }>;
          };
        };
      }
    ).__APP_SUPABASE_MOCK__ = {
      auth: {
        getSession: async () => ({
          data: { session },
          error: null,
        }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }),
        updateUser: async ({ data }) => ({
          data: {
            user: {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                ...data,
              },
            },
          },
          error: null,
        }),
      },
    };
  });

  await page.goto("/");
  await page.getByTestId("profile-entry").click();
  await expect(page.getByTestId("profile-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "个人资料", exact: true })).toBeVisible();

  await page.getByTestId("profile-nickname-input").fill("产品同学");
  await page.getByTestId("save-profile-nickname").click();
  await expect(page.getByRole("heading", { name: "产品同学", exact: true })).toBeVisible();

  await page.getByTestId("advanced-settings-link").click();
  await expect(page.getByRole("heading", { name: "高级设置", exact: true })).toBeVisible();
});
