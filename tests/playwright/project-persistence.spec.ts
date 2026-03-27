import { expect, test } from "@playwright/test";

test("legacy local project migrates into remote persistence and supports version actions", async ({
  page,
}) => {
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
          has_password: false,
          profile_email: "demo@example.com",
          profile_updated_at: "2026-03-27T09:10:00.000Z",
        },
        email_confirmed_at: "2026-03-27T09:00:00.000Z",
        last_sign_in_at: "2026-03-27T09:00:00.000Z",
        updated_at: "2026-03-27T09:10:00.000Z",
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-03-27T08:00:00.000Z",
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
          hasPassword: false,
          lastSignInAt: "2026-03-27T09:00:00.000Z",
          updatedAt: "2026-03-27T09:10:00.000Z",
        },
        session: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresAt: 1900000000,
        },
        lastSignInEmail: "demo@example.com",
        lastAuthMethod: "otp",
        rememberStartedAt: "2026-03-27T09:00:00.000Z",
        rememberUntil: "2026-04-03T09:00:00.000Z",
        pendingAction: null,
        pendingActionEmail: null,
      }),
    );

    localStorage.setItem(
      "ai_web_builder_projects",
      JSON.stringify([
        {
          id: "legacy-project",
          ownerUserId: "user-1",
          name: "Legacy Project",
          description: "Created locally before remote persistence",
          status: "active",
          files: {
            "index.html": "<div id='app'>Legacy</div>",
            "style.css": "body { color: red; }",
            "main.js": "console.log('legacy');",
          },
          messages: [
            {
              id: "legacy-message",
              role: "user",
              content: "Create a dashboard",
              createdAt: "2026-03-27T09:00:00.000Z",
              projectId: "legacy-project",
              ownerUserId: "user-1",
            },
          ],
          versions: [
            {
              id: "legacy-project-v1",
              versionNo: 1,
              summary: "Legacy snapshot",
              files: {
                "index.html": "<div id='app'>Legacy</div>",
                "style.css": "body { color: red; }",
                "main.js": "console.log('legacy');",
              },
              createdAt: "2026-03-27T09:00:00.000Z",
              projectId: "legacy-project",
              ownerUserId: "user-1",
            },
          ],
          preview: {
            entry: "index.html",
            framework: "vanilla",
          },
          createdAt: "2026-03-27T09:00:00.000Z",
          updatedAt: "2026-03-27T09:00:00.000Z",
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
          const remaining = table.filter((row) => !matches(row));
          db[this.tableName] = remaining;
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
            updateUser: ({
              data,
            }: {
              data: Record<string, unknown>;
            }) => Promise<{ data: { user: typeof session.user }; error: null }>;
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
        updateUser: async ({ data }) => ({
          data: {
            user: {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                ...data,
              },
            },
          },
          error: null,
        }),
      },
      from: (tableName) => new QueryBuilder(tableName),
    };
  });

  await page.goto("/");
  await expect(page.getByTestId("project-card-legacy-project")).toBeVisible();
  await expect(page.getByText("Legacy Project")).toBeVisible();

  await page.getByTestId("project-edit-legacy-project").click();
  await expect(page.getByTestId("save-version")).toBeVisible();

  await page.getByTestId("save-version").click();
  await page.getByTestId("open-version-panel").click();
  await expect(page.getByTestId("restore-version-legacy-project-v1")).toBeVisible();
  await page.getByTestId("restore-version-legacy-project-v1").click();

  await page.getByTestId("open-project-preview").click();
  await expect(page.locator('iframe[title="project-preview"]')).toBeVisible();
});
