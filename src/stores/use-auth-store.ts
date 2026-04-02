import { create } from "zustand";
import { authService } from "@/services/auth";
import { settingsService } from "@/services/settings";
import type { AuthStateSnapshot } from "@/types";

interface AuthStore extends AuthStateSnapshot {
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...authService.getSnapshot(),
  initialize: async () => {
    await authService.initialize();
    const snapshot = authService.getSnapshot();
    set(snapshot);

    // 已认证时从 Supabase 预加载用户设置到内存
    if (snapshot.isAuthenticated) {
      await settingsService.loadSettings();
    }
  },
}));

// 订阅认证状态变化，保存退订函数以便热更新时清理
const _unsubscribeAuth = authService.subscribe(() => {
  useAuthStore.setState(authService.getSnapshot());
});

// 支持 Vite HMR 时清理旧订阅，防止内存泄漏
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    _unsubscribeAuth();
  });
}
