export type AuthProvider = "email";
export type AuthMethod = "otp" | "password";
export type PendingAuthAction = "complete_registration" | "reset_password" | null;

export type ProjectStatus = "draft" | "active" | "archived";

export type ProjectFileMap = Record<string, string>;

/** 思维链步骤状态 */
export type ThinkingStepStatus = "pending" | "loading" | "success" | "error";

/** 思维链单步 */
export interface ThinkingStep {
  id: string;
  title: string;
  description?: string;
  status: ThinkingStepStatus;
  content?: string;
}

export interface ProjectMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  projectId: string;
  ownerUserId: string;
  /** AI 回复的思维链步骤 */
  thinkingSteps?: ThinkingStep[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ProjectVersion {
  id: string;
  versionNo: number;
  summary: string;
  files: ProjectFileMap;
  createdAt: string;
  projectId: string;
  ownerUserId: string;
}

export interface ProjectMeta {
  entry: string;
  framework: "vanilla";
}

export interface Project {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  files: ProjectFileMap;
  messages: ProjectMessage[];
  versions: ProjectVersion[];
  preview: ProjectMeta;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  provider: AuthProvider;
  emailVerified: boolean;
  lastSignInAt: string | null;
}

export interface UserProfileRecord extends UserProfile {
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

export interface PersistedAuthState {
  profile: UserProfile | null;
  session: AuthSession | null;
  lastSignInEmail: string | null;
  lastAuthMethod: AuthMethod | null;
  rememberStartedAt: string | null;
  rememberUntil: string | null;
  pendingAction: PendingAuthAction;
  pendingActionEmail: string | null;
}

export interface AuthStateSnapshot {
  profile: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  pendingAction: PendingAuthAction;
  pendingActionEmail: string | null;
  lastAuthMethod: AuthMethod | null;
  rememberUntil: string | null;
  lastError: string | null;
  authConfigured: boolean;
}

export interface EmailOtpRequestResult {
  status: "code_sent";
  email: string;
  message: string;
}

export interface EmailOtpVerificationResult {
  status: "authenticated" | "password_setup_required";
  email: string;
  message: string;
}

export interface PasswordRecoveryResult {
  email: string;
  message: string;
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  preferredModel: string;
  customBaseUrl: string;
  apiKey: string;
  notes: string;
}

export interface UserSettingsRecord {
  userId: string;
  settings: UserSettings;
  updatedAt: string;
}

export interface ProjectDataModelSnapshot {
  profile: UserProfileRecord | null;
  projects: Project[];
  projectVersions: ProjectVersion[];
  projectMessages: ProjectMessage[];
  userSettings: UserSettingsRecord | null;
}

export interface GeneratedProjectPayload {
  projectName: string;
  summary: string;
  files: ProjectFileMap;
  messages: Array<Omit<ProjectMessage, "projectId" | "ownerUserId">>;
  meta: ProjectMeta;
}
