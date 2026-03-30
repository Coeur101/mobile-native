import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localDb } from "@/lib/local-db";
import { createSupabaseProjectService } from "@/services/project";
import type { GeneratedProjectPayload, ProjectGenerationProgress, UserProfile } from "@/types";

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
    const matches = (row: Record<string, unknown>) =>
      this.filters.every((filter) => {
        if (filter.kind === "eq") {
          return row[filter.column] === filter.value;
        }

        return Array.isArray(filter.value) && filter.value.includes(row[filter.column]);
      });

    if (this.mode === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      table.push(...(rows as Array<Record<string, unknown>>));
      return Promise.resolve({ data: rows, error: null });
    }

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
      this.db[this.tableName] = table.filter((row) => !matches(row));
      return Promise.resolve({ data: null, error: null });
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

function createGeneratedPayload(): GeneratedProjectPayload {
  return {
    projectName: "Remote Project",
    summary: "Landing page",
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
        thinkingSteps: [
          {
            id: "step-1",
            title: "整理结构",
            description: "先确定主视觉和行动按钮。",
            content: "Hero 与 CTA 已就绪。",
            status: "success",
          },
        ],
        metadata: { provider: "mock-ai" },
      },
    ],
    meta: {
      entry: "index.html",
      framework: "vanilla",
    },
  };
}

describe("createSupabaseProjectService streaming", () => {
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

  it("does not persist partial assistant drafts before final completion", async () => {
    const db: FakeDatabase = {
      projects: [],
      project_versions: [],
      project_messages: [],
    };
    const progressEvents: ProjectGenerationProgress[] = [];
    let persistedMessagesDuringStream = -1;

    const service = createSupabaseProjectService({
      client: createFakeClient(db),
      aiService: {
        generateProjectFromPrompt: async (_prompt, _project, options) => {
          options?.onProgress?.({
            status: "streaming",
            content: "已先为你搭好页面框架",
            thinkingSteps: [
              {
                id: "step-1",
                title: "整理结构",
                description: "正在组织页面布局。",
                content: "Hero 与 CTA 正在生成。",
                status: "loading",
              },
            ],
          });
          persistedMessagesDuringStream = db.project_messages.length;
          return createGeneratedPayload();
        },
      },
    });

    const created = await service.createProject("Build a landing page", {
      onProgress: (progress) => progressEvents.push(progress),
    });

    expect(persistedMessagesDuringStream).toBe(0);
    expect(progressEvents.map((progress) => progress.status)).toEqual(["streaming", "persisting", "completed"]);
    expect(created.messages).toHaveLength(2);
    expect(db.project_messages).toHaveLength(2);
    const assistantMessage = created.messages.find((message) => message.role === "assistant");
    expect(assistantMessage?.thinkingSteps?.[0]?.status).toBe("success");
  });
});
