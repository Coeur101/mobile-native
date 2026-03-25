export type AuthProvider = "email" | "wechat";

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
}

export interface ProjectMeta {
  entry: string;
  framework: "vanilla";
}

export interface Project {
  id: string;
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
  email?: string;
  nickname: string;
  provider: AuthProvider;
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  preferredModel: string;
  customBaseUrl: string;
  apiKey: string;
  notes: string;
}

export interface GeneratedProjectPayload {
  projectName: string;
  summary: string;
  files: ProjectFileMap;
  messages: ProjectMessage[];
  meta: ProjectMeta;
}
