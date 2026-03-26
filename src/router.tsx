import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { HomePage } from "@/pages/home/HomePage";
import { LoginPage } from "@/pages/login/LoginPage";
import { EditorPage } from "@/pages/editor/EditorPage";
import { PreviewPage } from "@/pages/preview/PreviewPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { useAuthStore } from "@/stores/use-auth-store";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <div className="text-sm text-muted-foreground">正在恢复登录会话...</div>
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
    path: "/settings",
    Component: requireAuth(SettingsPage),
  },
]);
