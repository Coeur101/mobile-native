import { expect, test } from "@playwright/test";

test("编辑器会话在生成中展示流式内容与思维链", async ({ page }) => {
  await page.addInitScript(() => {
    const session = {
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      expires_at: 1_900_000_000,
      token_type: "bearer",
      user: {
        id: "user-1",
        email: "demo@example.com",
        user_metadata: {
          full_name: "Demo User",
          avatar_base64:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDk2IDk2Ij48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIyOCIgZmlsbD0iIzBGQTI1QSIvPjx0ZXh0IHg9IjQ4IiB5PSI1NiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RFU8L3RleHQ+PC9zdmc+",
          has_password: true,
          profile_email: "demo@example.com",
          profile_updated_at: "2026-03-30T10:00:00.000Z",
        },
        email_confirmed_at: "2026-03-30T10:00:00.000Z",
        last_sign_in_at: "2026-03-30T10:00:00.000Z",
        updated_at: "2026-03-30T10:00:00.000Z",
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-03-30T09:00:00.000Z",
      },
    };

    localStorage.setItem(
      "ai_web_builder_auth_state_v2",
      JSON.stringify({
        profile: {
          id: "user-1",
          email: "demo@example.com",
          nickname: "Demo User",
          avatarBase64:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDk2IDk2Ij48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIyOCIgZmlsbD0iIzBGQTI1QSIvPjx0ZXh0IHg9IjQ4IiB5PSI1NiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RFU8L3RleHQ+PC9zdmc+",
          provider: "email",
          emailVerified: true,
          hasPassword: true,
          lastSignInAt: "2026-03-30T10:00:00.000Z",
          updatedAt: "2026-03-30T10:00:00.000Z",
        },
        session: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresAt: 1900000000,
        },
        lastSignInEmail: "demo@example.com",
        lastAuthMethod: "password",
        rememberStartedAt: "2026-03-30T10:00:00.000Z",
        rememberUntil: "2026-04-06T10:00:00.000Z",
        pendingAction: null,
        pendingActionEmail: null,
      }),
    );

    localStorage.setItem(
      "ai_web_builder_settings_v3",
      JSON.stringify([
        {
          userId: "user-1",
          settings: {
            theme: "auto",
            preferredModel: "demo-model",
            customBaseUrl: "https://api.example.com/v1",
            apiKey: "demo-api-key",
            notes: "",
          },
          updatedAt: "2026-03-30T10:00:00.000Z",
        },
      ]),
    );

    const db = {
      projects: [] as Array<Record<string, unknown>>,
      project_versions: [] as Array<Record<string, unknown>>,
      project_messages: [] as Array<Record<string, unknown>>,
    };

    class QueryBuilder {
      private filters: Array<{ kind: "eq" | "in"; column: string; value: unknown }> = [];
      private mode: "select" | "insert" | "update" | "delete" | null = null;
      private payload: unknown = null;
      private single = false;
      private orderBy: { column: string; ascending: boolean } | null = null;

      constructor(private readonly tableName: keyof typeof db) {}

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

      then(resolve: (value: unknown) => void, reject: (reason?: unknown) => void) {
        this.execute().then(resolve, reject);
      }

      private execute() {
        const table = db[this.tableName];
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
          db[this.tableName] = table.filter((row) => !matches(row));
          return Promise.resolve({ data: null, error: null });
        }

        let rows = table.filter(matches);
        if (this.orderBy) {
          const { column, ascending } = this.orderBy;
          rows = [...rows].sort((left, right) => {
            const a = left[column];
            const b = right[column];
            if (a === b) return 0;
            return a! > b! ? (ascending ? 1 : -1) : ascending ? -1 : 1;
          });
        }

        return Promise.resolve({
          data: this.single ? rows[0] ?? null : rows,
          error: null,
        });
      }
    }

    (
      window as typeof window & {
        __APP_SUPABASE_MOCK__?: {
          auth: {
            getSession: () => Promise<{ data: { session: typeof session }; error: null }>;
            onAuthStateChange: () => {
              data: { subscription: { unsubscribe: () => void } };
            };
          };
          from: (tableName: keyof typeof db) => QueryBuilder;
        };
      }
    ).__APP_SUPABASE_MOCK__ = {
      auth: {
        getSession: async () => ({
          data: { session },
          error: null,
        }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }),
      },
      from: (tableName) => new QueryBuilder(tableName),
    };

    const originalFetch = window.fetch.bind(window);
    const streamPayload = JSON.stringify({
      projectName: "流式活动页",
      summary: "一页式活动落地页",
      assistantMessage: "已先为你搭好页面框架，正在补充样式和交互。",
      thinkingSteps: [
        {
          id: "step-1",
          title: "整理页面结构",
          description: "先确定 Hero 与 CTA 的层级。",
          content: "主标题、卖点与行动按钮已经成型。",
          status: "success",
        },
      ],
      files: {
        "index.html": "<!doctype html><html lang=\"zh-CN\"><body><main>stream ui</main></body></html>",
        "style.css": "body { margin: 0; font-family: sans-serif; }",
        "main.js": "console.log('stream-ui');",
      },
    });
    const chunks = [
      streamPayload.slice(0, 110),
      streamPayload.slice(110, 250),
      streamPayload.slice(250),
    ];

    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      if (!url.includes("/chat/completions")) {
        return originalFetch(input, init);
      }

      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            const pushChunk = (index: number) => {
              if (index >= chunks.length) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: chunks[index] } }] })}\n\n`,
                ),
              );
              setTimeout(() => pushChunk(index + 1), 40);
            };

            pushChunk(0);
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
          },
        },
      );
    };
  });

  await page.goto("/editor");
  await page.locator("textarea").fill("帮我生成一个活动页");
  await page.locator("textarea").press("Enter");

  const main = page.locator("main");

  await expect(page.getByText("新会话")).toBeVisible();
  await expect(main.getByText("帮我生成一个活动页").first()).toBeVisible();
  await expect(main.getByText("已先为你搭好页面框架").first()).toBeVisible();

  await expect(page.getByText("流式活动页").first()).toBeVisible();
  await expect(page.getByTestId("open-project-preview")).toBeVisible();
  await expect(page.getByText("思路生成完成")).toBeVisible();
});
