import type {
  AuthStateSnapshot,
  EmailOtpRequestResult,
  EmailOtpVerificationResult,
  PasswordRecoveryResult,
  UserProfile,
} from "@/types";

export type AuthStateListener = () => void;

export type EmailOtpPurpose = "login" | "register";

export interface AuthService {
  initialize(): Promise<void>;
  getCurrentUser(): UserProfile | null;
  getSnapshot(): AuthStateSnapshot;
  subscribe(listener: AuthStateListener): () => void;
  requestEmailOtp(email: string, purpose: EmailOtpPurpose): Promise<EmailOtpRequestResult>;
  verifyEmailOtp(
    email: string,
    token: string,
    purpose: EmailOtpPurpose,
  ): Promise<EmailOtpVerificationResult>;
  completeRegistration(password: string, nickname?: string): Promise<void>;
  requestPasswordReset(email: string): Promise<PasswordRecoveryResult>;
  completePasswordReset(password: string): Promise<void>;
  clearPendingAction(): Promise<void>;
  signOut(): Promise<void>;
}
