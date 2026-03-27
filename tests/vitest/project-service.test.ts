import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localDb } from "@/lib/local-db";
import { createSupabaseProjectService } from "@/services/project";
import type { GeneratedProjectPayload, Project, UserProfile } from "@/types";

type TableName = "projects" | "project_versions" | "project_messages";

type FakeDatabase = {
  projects: Array<Record<string, unknown>>;
  project_versions: Array<Record<string, unknown>>;
  project_messages: Array<Record<string, unknown>>;
};

class FakeQueryBuilder {
  private filters: Array<{ kind: "eq" | "in"; column: string; value: unknown }> = [];
  private mode: "select" | "insert" | "update" | "delete" | null = null;
  private payload: unknown = null;
  private single = false;
  private orderBy: { column: string; ascending: boolean } | null = null;

  constructor(
    private readonly tableName: TableName,
    private readonly db: FakeDatabase,
  ) {}

  select() {
    this.mode = "select";
    return this;
  }

  insert(payload: unknown) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ kind: "in", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    const table = this.db[this.tableName];

    if (this.mode === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      table.push(...(rows as Array<Record<string, unknown>>));
      return Promise.resolve({ data: rows, error: null });
    }

    const matches = (row: Record<string, unknown>) =>
      this.filters.every((filter) => {
        if (filter.kind === "eq") {
          return row[filter.column] === filter.value;
        }

        return Array.isArray(filter.value) && filter.value.includes(row[filter.column]);
      });

    if (this.mode === "update") {
      const updated: Array<Record<string, unknown>> = [];
      for (const row of table) {
        if (!matches(row)) continue;
        Object.assign(row, this.payload);
        updated.push(row);
      }
      return Promise.resolve({ data: updated, error: null });
    }

    if (this.mode === "delete") {
      const removed = table.filter(matches);
      this.db[this.tableName] = table.filter((row) => !matches(row));
      return Promise.resolve({ data: removed, error: null });
    }

    let rows = table.filter(matches);
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        const left = a[column];
        const right = b[column];
        if (left === right) return 0;
        if (left == null) return ascending ? -1 : 1;
        if (right == null) return ascending ? 1 : -1;
        return left > right ? (ascending ? 1 : -1) : ascending ? -1 : 1;
      });
    }

    if (this.single) {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    }

    return Promise.resolve({ data: rows, error: null });
  }
}

function createFakeClient(db: FakeDatabase) {
  return {
    from(tableName: string) {
      return new FakeQueryBuilder(tableName as TableName, db);
    },
  } as unknown as SupabaseClient;
}

const profile: UserProfile = {
  id: "user-1",
  email: "demo@example.com",
  nickname: "Demo",
  avatarBase64: "data:image/svg+xml;base64,abc",
  provider: "email",
  emailVerified: true,
  hasPassword: true,
  lastSignInAt: "2026-03-27T00:00:00.000Z",
  updatedAt: "2026-03-27T00:00:00.000Z",
};

function createGeneratedPayload(summary: string): GeneratedProjectPayload {
  return {
    projectName: "Remote Project",
    summary,
    files: {
      "index.html": "<div>Hello</div>",
      "style.css": "body { color: red; }",
      "main.js": "console.log('ok')",
    },
    messages: [
      {
        id: "assistant-message",
        role: "assistant",
        content: "Generated project output",
        createdAt: "2026-03-27T10:00:00.000Z",
        metadata: { provider: "mock-ai" },
      },
    ],
    meta: {
      entry: "index.html",
      framework: "vanilla",
    },
  };
}

describe("createSupabaseProjectService", () => {
  beforeEach(() => {
    localStorage.clear();
    localDb.saveAuthState({
      profile,
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 1_900_000_000,
      },
      lastSignInEmail: profile.email,
      lastAuthMethod: "otp",
      rememberStartedAt: "2026-03-27T00:00:00.000Z",
      rememberUntil: "2026-04-03T00:00:00.000Z",
      pendingAction: null,
      pendingActionEmail: null,
    });
  });

  it("creates a remote-backed project with version and message records", async () => {
    const db: FakeDatabase = {
      projects: [],
      project_versions: [],
      project_messages: [],
    };
    const service = createSupabaseProjectService({
      client: createFakeClient(db),
      aiService: {
        generateProjectFromPrompt: async () => createGeneratedPayload("Landing page"),
      },
    });

    const created = await service.createProject("Build a landing page");

    expect(created.ownerUserId).toBe(profile.id);
    expect(db.projects).toHaveLength(1);
    expect(db.project_versions).toHaveLength(1);
    expect(db.project_messages).toHaveLength(2);
    expect(created.versions[0]?.versionNo).toBe(1);
    expect(created.messages).toHaveLength(2);
  });

  it("lists only the authenticated user's remote projects", async () => {
    const db: FakeDatabase = {
      projects: [
        {
          id: "project-1",
          owner_user_id: profile.id,
          name: "Mine",
          description: "Owned by current user",
          status: "active",
          files: { "index.html": "<div>mine</div>" },
          preview: { entry: "index.html", framework: "vanilla" },
          created_at: "2026-03-27T09:00:00.000Z",
          updated_at: "2026-03-27T10:00:00.000Z",
        },
        {
          id: "project-2",
          owner_user_id: "user-2",
          name: "Other",
          description: "Owned by another user",
          status: "active",
          files: { "index.html": "<div>other</div>" },
          preview: { entry: "index.html", framework: "vanilla" },
          created_at: "2026-03-27T09:00:00.000Z",
          updated_at: "2026-03-27T10:00:00.000Z",
        },
      ],
      project_versions: [
        {
          id: "project-1-v1",
          version_no: 1,
          summary: "Initial",
          files: { "index.html": "<div>mine</div>" },
          created_at: "2026-03-27T09:00:00.000Z",
          project_id: "project-1",
          owner_user_id: profile.id,
        },
      ],
      project_messages: [],
    };
    const service = createSupabaseProjectService({
      client: createFakeClient(db),
    });

    const projects = await service.listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]?.id).toBe("project-1");
    expect(localDb.getProjects()).toHaveLength(1);
  });

  it("continues a project by updating files, version history, and messages", async () => {
    const db: FakeDatabase = {
      projects: [
        {
          id: "project-1",
          owner_user_id: profile.id,
          name: "Mine",
          description: "Initial project",
          status: "active",
          files: { "index.html": "<div>before</div>" },
          preview: { entry: "index.html", framework: "vanilla" },
          created_at: "2026-03-27T09:00:00.000Z",
          updated_at: "2026-03-27T10:00:00.000Z",
        },
      ],
      project_versions: [
        {
          id: "project-1-v1",
          version_no: 1,
          summary: "Initial",
          files: { "index.html": "<div>before</div>" },
          created_at: "2026-03-27T09:00:00.000Z",
          project_id: "project-1",
          owner_user_id: profile.id,
        },
      ],
      project_messages: [],
    };
    const service = createSupabaseProjectService({
      client: createFakeClient(db),
      aiService: {
        generateProjectFromPrompt: async (_prompt, project?: Project) =>
          createGeneratedPayload(`Updated from ${project?.name}`),
      },
    });

    const updated = await service.continueProject("project-1", "Add testimonials");

    expect(updated).not.toBeNull();
    expect(updated?.description).toBe("Updated from Mine");
    expect(updated?.versions).toHaveLength(2);
    expect(updated?.messages).toHaveLength(2);
    expect(db.project_versions).toHaveLength(2);
    expect(db.project_messages).toHaveLength(2);
  });

  it("migrates local legacy projects into the remote backing store once", async () => {
    const localProject: Project = {
      id: "legacy-project",
      ownerUserId: profile.id,
      name: "Legacy Project",
      description: "Created before remote persistence",
      status: "active",
      files: {
        "index.html": "<div>legacy</div>",
      },
      messages: [
        {
          id: "legacy-message",
          role: "user",
          content: "Create a dashboard",
          createdAt: "2026-03-27T09:00:00.000Z",
          projectId: "legacy-project",
          ownerUserId: profile.id,
        },
      ],
      versions: [
        {
          id: "legacy-project-v1",
          versionNo: 1,
          summary: "Legacy snapshot",
          files: {
            "index.html": "<div>legacy</div>",
          },
          createdAt: "2026-03-27T09:00:00.000Z",
          projectId: "legacy-project",
          ownerUserId: profile.id,
        },
      ],
      preview: {
        entry: "index.html",
        framework: "vanilla",
      },
      createdAt: "2026-03-27T09:00:00.000Z",
      updatedAt: "2026-03-27T09:00:00.000Z",
    };
    localDb.saveProjects([localProject]);

    const db: FakeDatabase = {
      projects: [],
      project_versions: [],
      project_messages: [],
    };
    const service = createSupabaseProjectService({
      client: createFakeClient(db),
    });

    const projects = await service.listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]?.id).toBe("legacy-project");
    expect(db.projects).toHaveLength(1);
    expect(db.project_versions).toHaveLength(1);
    expect(db.project_messages).toHaveLength(1);
    expect(localDb.hasProjectMigrationCompleted(profile.id)).toBe(true);
  });
});
