import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    include: ["src/**/*.test.{ts,tsx}", "tests/vitest/**/*.test.{ts,tsx}", ".tmp/task-runs/vitest/**/*.test.{ts,tsx}"],
    exclude: [".tmp/task-runs/playwright/**", "node_modules/**"],
  },
});
