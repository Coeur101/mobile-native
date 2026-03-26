import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".tmp/task-runs/playwright",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: true,
    env: {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "public-anon-key-for-ui-tests",
      VITE_SUPABASE_EMAIL_REDIRECT_TO: "http://127.0.0.1:4173/login",
    },
  },
  projects: [
    {
      name: "edge",
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
      },
    },
  ],
  reporter: [["list"]],
});
