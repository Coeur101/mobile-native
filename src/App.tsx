import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { router } from "./router";
import { useThemeStore, applyTheme } from "./stores/use-theme-store";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { useAuthStore } from "./stores/use-auth-store";

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const resolvedMode =
    mode === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;

  // 初始化和响应主题变化
  useEffect(() => {
    applyTheme(mode);

    // auto 模式监听系统主题变化
    if (mode === "auto") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("auto");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [mode]);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        visibleToasts={2}
        offset="5rem"
        gap={8}
        theme={resolvedMode}
        toastOptions={{
          className:
            "rounded-[20px] border border-border bg-card/95 text-foreground shadow-[0_12px_32px_rgba(15,23,42,0.10)] backdrop-blur-xl",
        }}
      />
    </ErrorBoundary>
  );
}
