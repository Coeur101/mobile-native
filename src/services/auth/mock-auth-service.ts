import { localDb } from "@/lib/local-db";
import type { AuthService } from "./auth-service";
import type { UserProfile } from "@/types";

function buildProfile(provider: UserProfile["provider"], email?: string): UserProfile {
  return {
    id: provider === "email" ? "email-user" : "wechat-user",
    email,
    nickname: provider === "email" ? "邮箱演示用户" : "微信演示用户",
    provider,
  };
}

export const mockAuthService: AuthService = {
  getCurrentUser() {
    return localDb.getUser();
  },
  async signInWithEmail(email) {
    const profile = buildProfile("email", email || "demo@example.com");
    localDb.saveUser(profile);
    return profile;
  },
  async signInWithWechat() {
    const profile = buildProfile("wechat");
    localDb.saveUser(profile);
    return profile;
  },
  async signOut() {
    localDb.saveUser(null);
  },
};
