import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { HomePage } from "@/pages/home/HomePage";
import { LoginPage } from "@/pages/login/LoginPage";
import { EditorPage } from "@/pages/editor/EditorPage";
import { PreviewPage } from "@/pages/preview/PreviewPage";
import { UserProfilePage } from "@/pages/profile/UserProfilePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { useAuthStore } from "@/stores/use-auth-store";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm rounded-[32px] border border-border bg-card/90 px-6 py-8 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
        <div className="mt-4 text-base font-semibold text-foreground">正在确认登录状态</div>
        <div className="mt-1 text-sm text-muted-foreground">请稍候，我们正在恢复你的工作区。</div>
      </div>
    </div>
  );
}

function requireAuth(Component: ComponentType) {
  return function ProtectedRoute() {
    const isLoading = useAuthStore((state) => state.isLoading);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isLoading) {
      return <AuthLoadingScreen />;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Component />;
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: requireAuth(HomePage),
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/editor/:projectId?",
    Component: requireAuth(EditorPage),
  },
  {
    path: "/preview/:projectId",
    Component: requireAuth(PreviewPage),
  },
  {
    path: "/profile",
    Component: requireAuth(UserProfilePage),
  },
  {
    path: "/settings",
    Component: requireAuth(SettingsPage),
  },
]);
