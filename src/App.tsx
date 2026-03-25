import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { router } from "./router";
import { useThemeStore, applyTheme } from "./stores/use-theme-store";
import { ErrorBoundary } from "./components/ui/error-boundary";

export default function App() {
  const mode = useThemeStore((s) => s.mode);

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

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" richColors offset="80px" />
    </ErrorBoundary>
  );
}
