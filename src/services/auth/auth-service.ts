import type {
  AuthStateSnapshot,
  EmailOtpRequestResult,
  EmailOtpVerificationResult,
  PasswordRecoveryResult,
  PasswordSecurityOtpResult,
  UserProfile,
  UserProfileUpdateInput,
} from "@/types";

export type AuthStateListener = () => void;

export type EmailOtpPurpose = "login" | "register";

export interface AuthService {
  initialize(): Promise<void>;
  getCurrentUser(): UserProfile | null;
  getSnapshot(): AuthStateSnapshot;
  subscribe(listener: AuthStateListener): () => void;
  signInWithPassword(email: string, password: string): Promise<void>;
  requestEmailOtp(email: string, purpose: EmailOtpPurpose): Promise<EmailOtpRequestResult>;
  verifyEmailOtp(
    email: string,
    token: string,
    purpose: EmailOtpPurpose,
  ): Promise<EmailOtpVerificationResult>;
  updateProfile(updates: UserProfileUpdateInput): Promise<UserProfile>;
  requestPasswordReauthentication(): Promise<PasswordSecurityOtpResult>;
  updatePasswordWithNonce(password: string, nonce: string): Promise<void>;
  completeRegistration(password: string, nickname?: string): Promise<void>;
  requestPasswordReset(email: string): Promise<PasswordRecoveryResult>;
  completePasswordReset(password: string): Promise<void>;
  clearPendingAction(): Promise<void>;
  signOut(): Promise<void>;
}
