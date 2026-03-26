import { create } from "zustand";
import { authService } from "@/services/auth";
import type { AuthStateSnapshot } from "@/types";

interface AuthStore extends AuthStateSnapshot {
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...authService.getSnapshot(),
  initialize: async () => {
    await authService.initialize();
    set(authService.getSnapshot());
  },
}));

authService.subscribe(() => {
  useAuthStore.setState(authService.getSnapshot());
});
