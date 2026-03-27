import { describe, expect, it, beforeEach } from "vitest";
import { localDb } from "@/lib/local-db";
import { hasRememberWindowExpired } from "@/services/auth/supabase-auth-service";
import type { PersistedAuthState, Project, UserProfile } from "@/types";

const profile: UserProfile = {
  id: "user-1",
  email: "demo@example.com",
  nickname: "Demo",
  provider: "email",
  emailVerified: true,
  lastSignInAt: "2026-03-27T00:00:00.000Z",
};

const authState: PersistedAuthState = {
  profile,
  session: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 1_800_000_000,
  },
  lastSignInEmail: profile.email,
  lastAuthMethod: "password",
  rememberStartedAt: "2026-03-27T00:00:00.000Z",
  rememberUntil: "2026-04-03T00:00:00.000Z",
  pendingAction: null,
  pendingActionEmail: null,
};

const project: Project = {
  id: "project-1",
  ownerUserId: profile.id,
  name: "Smoke Project",
  description: "用于验证本地数据模型",
  status: "active",
  files: {
    "index.html": "<div id=\"app\"></div>",
    "style.css": "body { margin: 0; }",
    "main.js": "console.log('ok')",
  },
  messages: [
    {
      id: "message-1",
      role: "user",
      content: "生成一个登录页",
      createdAt: "2026-03-27T00:00:00.000Z",
      projectId: "project-1",
      ownerUserId: profile.id,
    },
  ],
  versions: [
    {
      id: "version-1",
      versionNo: 1,
      summary: "初始版本",
      files: {
        "index.html": "<div id=\"app\"></div>",
        "style.css": "body { margin: 0; }",
        "main.js": "console.log('ok')",
      },
      createdAt: "2026-03-27T00:00:00.000Z",
      projectId: "project-1",
      ownerUserId: profile.id,
    },
  ],
  preview: {
    entry: "index.html",
    framework: "vanilla",
  },
  createdAt: "2026-03-27T00:00:00.000Z",
  updatedAt: "2026-03-27T00:00:00.000Z",
};

describe("localDb", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("在未登录时返回空项目列表", () => {
    expect(localDb.getProjects()).toEqual([]);
    expect(localDb.getUser()).toBeNull();
  });

  it("能保存并读取当前登录用户的项目与用户信息", () => {
    localDb.saveAuthState(authState);
    localDb.saveProjects([project]);

    expect(localDb.getUser()).toEqual(profile);
    expect(localDb.getProjects()).toEqual([project]);

    const snapshot = localDb.getProjectDataModelSnapshot();
    expect(snapshot.profile?.id).toBe(profile.id);
    expect(snapshot.projects).toHaveLength(1);
    expect(snapshot.projectVersions).toHaveLength(1);
    expect(snapshot.projectMessages).toHaveLength(1);
  });
});

describe("hasRememberWindowExpired", () => {
  it("在 rememberUntil 为空时返回 false", () => {
    expect(hasRememberWindowExpired({ rememberUntil: null }, Date.now())).toBe(false);
  });

  it("在记住登录窗口过期后返回 true", () => {
    expect(
      hasRememberWindowExpired(
        { rememberUntil: "2026-03-27T00:00:00.000Z" },
        Date.parse("2026-03-27T00:00:01.000Z"),
      ),
    ).toBe(true);
  });
});
