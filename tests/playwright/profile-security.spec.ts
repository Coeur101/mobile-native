import { expect, test } from "@playwright/test";

test("authenticated user can upload an avatar and complete password setup from profile", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let currentSession = {
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
            getSession: () => Promise<{ data: { session: typeof currentSession }; error: null }>;
            onAuthStateChange: () => {
              data: { subscription: { unsubscribe: () => void } };
            };
            updateUser: (payload: {
              password?: string;
              nonce?: string;
              data?: Record<string, unknown>;
            }) => Promise<{ data: { user: typeof currentSession.user }; error: null }>;
            reauthenticate: () => Promise<{ data: { user: null; session: null }; error: null }>;
          };
        };
      }
    ).__APP_SUPABASE_MOCK__ = {
      auth: {
        getSession: async () => ({
          data: { session: currentSession },
          error: null,
        }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }),
        updateUser: async (payload) => {
          currentSession = {
            ...currentSession,
            user: {
              ...currentSession.user,
              user_metadata: {
                ...currentSession.user.user_metadata,
                ...(payload.data ?? {}),
              },
            },
          };

          return {
            data: {
              user: currentSession.user,
            },
            error: null,
          };
        },
        reauthenticate: async () => ({
          data: { user: null, session: null },
          error: null,
        }),
      },
    };
  });

  await page.goto("/");
  await page.getByTestId("profile-entry").click();

  const avatarImage = page.getByTestId("profile-avatar-image");
  const initialSrc = await avatarImage.getAttribute("src");

  await page.getByTestId("avatar-file-input").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s3FoX8AAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect.poll(async () => avatarImage.getAttribute("src")).not.toBe(initialSrc);

  await page.getByTestId("start-password-security-action").click();
  await expect(page.getByTestId("password-security-dialog")).toBeVisible();
  await page.getByTestId("send-security-code").click();
  await page.getByTestId("security-code-input").fill("654321");
  await page.getByTestId("security-password-input").fill("supersafe-password");
  await page.getByTestId("security-password-confirm-input").fill("supersafe-password");
  await page.getByTestId("confirm-password-security-action").click();

  await expect(page.getByTestId("password-status")).toHaveText("Password set");
});