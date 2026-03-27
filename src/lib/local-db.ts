import type {
  PersistedAuthState,
  Project,
  ProjectDataModelSnapshot,
  ProjectFileMap,
  ProjectMessage,
  ProjectVersion,
  UserProfile,
  UserProfileRecord,
  UserSettings,
  UserSettingsRecord,
} from "@/types";

const PROJECTS_KEY = "ai_web_builder_projects";
const SETTINGS_KEY = "ai_web_builder_settings_v3";
const LEGACY_SETTINGS_KEY = "ai_web_builder_settings";
const AUTH_STATE_KEY = "ai_web_builder_auth_state_v2";
const LEGACY_AUTH_STATE_KEY = "ai_web_builder_auth_state_v1";
const PROJECT_MIGRATIONS_KEY = "ai_web_builder_project_migrations_v1";
const AUTH_KEY = "ai_web_builder_auth_v2";
const LEGACY_AUTH_KEY = "fake_user_logged_in";
const LEGACY_OWNER_ID = "legacy-local-user";
const LOCAL_SETTINGS_OWNER_ID = "local-device";

type LegacyProject = {
  id: string;
  title?: string;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  code?: string;
  chatHistory?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string | Date;
  }>;
};

type ProjectMigrationRecord = {
  userId: string;
  completedAt: string;
  projectIds: string[];
};

const defaultFiles = (): ProjectFileMap => ({
  "index.html": "<div id=\"app\"></div>",
  "style.css": "body { font-family: system-ui, sans-serif; }",
  "main.js": "document.getElementById('app').innerHTML = '<h1>Hello</h1>';",
});

const defaultAuthState = (): PersistedAuthState => ({
  profile: null,
  session: null,
  lastSignInEmail: null,
  lastAuthMethod: null,
  rememberStartedAt: null,
  rememberUntil: null,
  pendingAction: null,
  pendingActionEmail: null,
});

export const defaultSettings: UserSettings = {
  theme: "auto",
  preferredModel: "mock-gpt",
  customBaseUrl: "",
  apiKey: "",
  notes: "当前为演示模式，设置仅保存在本地。",
};

function toIsoDate(value?: string | Date): string {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function getStoredAuthState(): PersistedAuthState {
  const current =
    readJson<Partial<PersistedAuthState>>(AUTH_STATE_KEY) ??
    readJson<Partial<PersistedAuthState>>(LEGACY_AUTH_STATE_KEY);

  if (current) {
    const pendingAction = current.pendingAction ?? null;
    return {
      profile: current.profile ?? null,
      session: current.session ?? null,
      lastSignInEmail: current.lastSignInEmail ?? current.profile?.email ?? null,
      lastAuthMethod: current.lastAuthMethod ?? null,
      rememberStartedAt: current.rememberStartedAt ?? null,
      rememberUntil: current.rememberUntil ?? null,
      pendingAction,
      pendingActionEmail: pendingAction
        ? current.pendingActionEmail ?? current.lastSignInEmail ?? current.profile?.email ?? null
        : null,
    };
  }

  const legacyCurrent = readJson<Partial<UserProfile>>(AUTH_KEY);
  if (legacyCurrent) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    return {
      ...defaultAuthState(),
      lastSignInEmail: typeof legacyCurrent.email === "string" ? legacyCurrent.email : null,
    };
  }

  localStorage.removeItem(LEGACY_AUTH_KEY);
  return defaultAuthState();
}

function resolveCurrentUserId(): string | null {
  return getStoredAuthState().profile?.id ?? null;
}

function resolveSettingsOwnerId(): string {
  return resolveCurrentUserId() ?? LOCAL_SETTINGS_OWNER_ID;
}

function normalizeMessages(
  projectId: string,
  ownerUserId: string,
  legacy?: LegacyProject["chatHistory"],
): ProjectMessage[] {
  return (legacy ?? []).map((item) => ({
    id: item.id,
    role: item.role,
    content: item.content,
    createdAt: toIsoDate(item.timestamp),
    projectId,
    ownerUserId,
  }));
}

function normalizeFiles(project: LegacyProject): ProjectFileMap {
  if (project.code) {
    return {
      "index.html": project.code,
      "style.css": "body { margin: 0; }",
      "main.js": "",
    };
  }

  return defaultFiles();
}

function migrateProject(project: LegacyProject, fallbackOwnerId: string): Project {
  const messages = normalizeMessages(project.id, fallbackOwnerId, project.chatHistory);
  const files = normalizeFiles(project);
  const createdAt = toIsoDate(project.createdAt);
  const updatedAt = toIsoDate(project.updatedAt);

  return {
    id: project.id,
    ownerUserId: fallbackOwnerId,
    name: project.title ?? "未命名项目",
    description: project.description ?? "从旧版原型迁移的数据",
    status: "active",
    files,
    messages,
    versions: [
      {
        id: `${project.id}-v1`,
        versionNo: 1,
        summary: "旧版数据迁移生成初始快照",
        files,
        createdAt,
        projectId: project.id,
        ownerUserId: fallbackOwnerId,
      },
    ],
    preview: {
      entry: "index.html",
      framework: "vanilla",
    },
    createdAt,
    updatedAt,
  };
}

function normalizeProject(project: Project | LegacyProject, fallbackOwnerId: string): Project {
  if (!("files" in project && "messages" in project && "versions" in project)) {
    return migrateProject(project, fallbackOwnerId);
  }

  const ownerUserId = project.ownerUserId ?? fallbackOwnerId;
  const normalizedMessages = project.messages.map((message) => ({
    ...message,
    projectId: message.projectId ?? project.id,
    ownerUserId: message.ownerUserId ?? ownerUserId,
  }));
  const normalizedVersions = project.versions.map((version) => ({
    ...version,
    projectId: version.projectId ?? project.id,
    ownerUserId: version.ownerUserId ?? ownerUserId,
  }));

  return {
    ...project,
    ownerUserId,
    messages: normalizedMessages,
    versions: normalizedVersions,
  };
}

function parseProjects(): Project[] {
  const parsed = readJson<Array<Project | LegacyProject>>(PROJECTS_KEY);
  if (!parsed) {
    return [];
  }

  const fallbackOwnerId = resolveCurrentUserId() ?? LEGACY_OWNER_ID;
  return parsed.map((item) => normalizeProject(item, fallbackOwnerId));
}

function parseSettingsRecords(): UserSettingsRecord[] {
  const current = readJson<UserSettingsRecord[] | UserSettings>(SETTINGS_KEY);
  if (current) {
    if (Array.isArray(current)) {
      return current;
    }

    return [
      {
        userId: resolveSettingsOwnerId(),
        settings: current,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const legacy = readJson<{
    uiStyle?: "light" | "dark" | "auto";
    baseUrl?: string;
    apiKey?: string;
  }>(LEGACY_SETTINGS_KEY);

  if (!legacy) {
    return [];
  }

  return [
    {
      userId: resolveSettingsOwnerId(),
      settings: {
        theme: legacy.uiStyle ?? "auto",
        preferredModel: "mock-gpt",
        customBaseUrl: legacy.baseUrl ?? "",
        apiKey: legacy.apiKey ?? "",
        notes: "已从旧版设置迁移完成，当前仍为本地演示模式。",
      },
      updatedAt: new Date().toISOString(),
    },
  ];
}

function parseProjectMigrationRecords(): ProjectMigrationRecord[] {
  return readJson<ProjectMigrationRecord[]>(PROJECT_MIGRATIONS_KEY) ?? [];
}

function saveProjectMigrationRecords(records: ProjectMigrationRecord[]) {
  localStorage.setItem(PROJECT_MIGRATIONS_KEY, JSON.stringify(records));
}

function saveSettingsRecords(records: UserSettingsRecord[]) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(records));
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
}

function toUserProfileRecord(profile: UserProfile): UserProfileRecord {
  const updatedAt = profile.updatedAt ?? profile.lastSignInAt ?? new Date().toISOString();
  return {
    ...profile,
    createdAt: updatedAt,
    updatedAt,
  };
}

export const localDb = {
  getProjects(): Project[] {
    const currentUserId = resolveCurrentUserId();
    if (!currentUserId) {
      return [];
    }

    return parseProjects().filter((project) => project.ownerUserId === currentUserId);
  },
  saveProjects(projects: Project[]) {
    const currentUserId = resolveCurrentUserId();
    if (!currentUserId) {
      return;
    }

    const existing = parseProjects().filter((project) => project.ownerUserId !== currentUserId);
    const normalized = projects.map((project) => normalizeProject(project, currentUserId));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([...existing, ...normalized]));
  },
  getSettings(): UserSettings {
    const ownerId = resolveSettingsOwnerId();
    const record = parseSettingsRecords().find((item) => item.userId === ownerId);
    return record?.settings ?? defaultSettings;
  },
  saveSettings(settings: UserSettings) {
    const ownerId = resolveSettingsOwnerId();
    const records = parseSettingsRecords();
    const nextRecord: UserSettingsRecord = {
      userId: ownerId,
      settings,
      updatedAt: new Date().toISOString(),
    };
    const nextRecords = records.filter((item) => item.userId !== ownerId);
    nextRecords.push(nextRecord);
    saveSettingsRecords(nextRecords);
  },
  getProjectMigrationRecord(userId: string): ProjectMigrationRecord | null {
    return parseProjectMigrationRecords().find((item) => item.userId === userId) ?? null;
  },
  hasProjectMigrationCompleted(userId: string): boolean {
    return Boolean(this.getProjectMigrationRecord(userId));
  },
  markProjectMigrationCompleted(userId: string, projectIds: string[]) {
    const records = parseProjectMigrationRecords().filter((item) => item.userId !== userId);
    records.push({
      userId,
      completedAt: new Date().toISOString(),
      projectIds,
    });
    saveProjectMigrationRecords(records);
  },
  getAuthState(): PersistedAuthState {
    return getStoredAuthState();
  },
  saveAuthState(state: PersistedAuthState) {
    const normalized: PersistedAuthState = {
      profile: state.profile,
      session: state.session,
      lastSignInEmail: state.lastSignInEmail,
      lastAuthMethod: state.lastAuthMethod,
      rememberStartedAt: state.rememberStartedAt,
      rememberUntil: state.rememberUntil,
      pendingAction: state.pendingAction,
      pendingActionEmail: state.pendingActionEmail,
    };

    if (
      !normalized.profile &&
      !normalized.session &&
      !normalized.lastSignInEmail &&
      !normalized.pendingAction &&
      !normalized.pendingActionEmail
    ) {
      localStorage.removeItem(AUTH_STATE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STATE_KEY);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(LEGACY_AUTH_KEY);
      return;
    }

    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(normalized));
    localStorage.removeItem(LEGACY_AUTH_STATE_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LEGACY_AUTH_KEY);
  },
  getUser(): UserProfile | null {
    return this.getAuthState().profile;
  },
  saveUser(profile: UserProfile | null) {
    const current = this.getAuthState();
    this.saveAuthState({
      ...current,
      profile,
      session: profile ? current.session : null,
      lastSignInEmail: profile?.email ?? current.lastSignInEmail,
    });
  },
  getProjectDataModelSnapshot(): ProjectDataModelSnapshot {
    const authState = this.getAuthState();
    const profile = authState.profile ? toUserProfileRecord(authState.profile) : null;
    const ownerId = authState.profile?.id ?? null;
    const projects = ownerId
      ? parseProjects().filter((project) => project.ownerUserId === ownerId)
      : [];
    const projectVersions: ProjectVersion[] = projects.flatMap((project) => project.versions);
    const projectMessages: ProjectMessage[] = projects.flatMap((project) => project.messages);
    const userSettings =
      ownerId
        ? parseSettingsRecords().find((item) => item.userId === ownerId) ?? null
        : null;

    return {
      profile,
      projects,
      projectVersions,
      projectMessages,
      userSettings,
    };
  },
};
