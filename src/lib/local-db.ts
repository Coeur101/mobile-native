import type {
  Project,
  ProjectFileMap,
  ProjectMessage,
  UserProfile,
  UserSettings,
} from "@/types";

const PROJECTS_KEY = "ai_web_builder_projects";
const SETTINGS_KEY = "ai_web_builder_settings_v2";
const LEGACY_SETTINGS_KEY = "ai_web_builder_settings";
const AUTH_KEY = "ai_web_builder_auth_v2";
const LEGACY_AUTH_KEY = "fake_user_logged_in";

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

const defaultFiles = (): ProjectFileMap => ({
  "index.html": "<div id=\"app\"></div>",
  "style.css": "body { font-family: system-ui, sans-serif; }",
  "main.js": "document.getElementById('app').innerHTML = '<h1>Hello</h1>';",
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

function normalizeMessages(
  legacy?: LegacyProject["chatHistory"],
): ProjectMessage[] {
  return (legacy ?? []).map((item) => ({
    id: item.id,
    role: item.role,
    content: item.content,
    createdAt: toIsoDate(item.timestamp),
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

function migrateProject(project: LegacyProject): Project {
  const messages = normalizeMessages(project.chatHistory);
  const files = normalizeFiles(project);
  const createdAt = toIsoDate(project.createdAt);
  const updatedAt = toIsoDate(project.updatedAt);

  return {
    id: project.id,
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

function parseProjects(): Project[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Project | LegacyProject>;
    return parsed.map((item) => {
      if ("files" in item && "messages" in item && "versions" in item) {
        return item;
      }
      return migrateProject(item);
    });
  } catch {
    return [];
  }
}

export const localDb = {
  getProjects(): Project[] {
    return parseProjects();
  },
  saveProjects(projects: Project[]) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },
  getSettings(): UserSettings {
    const current = localStorage.getItem(SETTINGS_KEY);
    if (current) {
      return JSON.parse(current) as UserSettings;
    }

    const legacy = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (!legacy) {
      return defaultSettings;
    }

    try {
      const parsed = JSON.parse(legacy) as {
        uiStyle?: "light" | "dark" | "auto";
        baseUrl?: string;
        apiKey?: string;
      };

      return {
        theme: parsed.uiStyle ?? "auto",
        preferredModel: "mock-gpt",
        customBaseUrl: parsed.baseUrl ?? "",
        apiKey: parsed.apiKey ?? "",
        notes: "从旧版设置迁移完成，当前仍为本地演示模式。",
      };
    } catch {
      return defaultSettings;
    }
  },
  saveSettings(settings: UserSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  getUser(): UserProfile | null {
    const current = localStorage.getItem(AUTH_KEY);
    if (current) {
      return JSON.parse(current) as UserProfile;
    }

    const legacy = localStorage.getItem(LEGACY_AUTH_KEY);
    if (legacy === "true") {
      return {
        id: "demo-user",
        email: "demo@example.com",
        nickname: "演示用户",
        provider: "wechat",
      };
    }

    return null;
  },
  saveUser(profile: UserProfile | null) {
    if (!profile) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(LEGACY_AUTH_KEY);
      return;
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
  },
};
