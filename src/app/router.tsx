import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { HomePage } from "@/pages/home/HomePage";
import { LoginPage } from "@/pages/login/LoginPage";
import { EditorPage } from "@/pages/editor/EditorPage";
import { PreviewPage } from "@/pages/preview/PreviewPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { mockAuthService } from "@/services/auth/mock-auth-service";

function requireAuth(Component: ComponentType) {
  return function ProtectedRoute() {
    const user = mockAuthService.getCurrentUser();
    if (!user) {
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
