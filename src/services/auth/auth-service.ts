import type { UserProfile } from "@/types";

export interface AuthService {
  getCurrentUser(): UserProfile | null;
  signInWithEmail(email: string): Promise<UserProfile>;
  signInWithWechat(): Promise<UserProfile>;
  signOut(): Promise<void>;
}
