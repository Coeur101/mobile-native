import { beforeEach, describe, expect, it } from "vitest";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { localDb } from "@/lib/local-db";
import type { PersistedAuthState } from "@/types";
import {
  buildDefaultAvatarDataUrl,
  buildNickname,
  buildUserProfileFromSession,
  createSupabaseAuthService,
} from "@/services/auth/supabase-auth-service";

function createSession(userMetadata: Record<string, unknown> = {}) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: 1_900_000_000,
    token_type: "bearer",
    user: {
      id: "user-1",
      email: "demo@example.com",
      user_metadata: userMetadata,
      email_confirmed_at: "2026-03-27T09:00:00.000Z",
      last_sign_in_at: "2026-03-27T09:00:00.000Z",
      updated_at: "2026-03-27T09:05:00.000Z",
      app_metadata: {},
      aud: "authenticated",
      created_at: "2026-03-27T08:00:00.000Z",
    },
  } as Session;
}

describe("buildNickname", () => {
  it("从邮箱前缀生成默认昵称", () => {
    expect(buildNickname("demo@example.com")).toBe("demo");
  });
});

describe("buildDefaultAvatarDataUrl", () => {
  it("生成可直接展示的 SVG data url", () => {
    expect(buildDefaultAvatarDataUrl("demo@example.com")).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

describe("buildUserProfileFromSession", () => {
  it("在 metadata 缺失时生成默认 profile 字段", () => {
    const profile = buildUserProfileFromSession(createSession());

    expect(profile.email).toBe("demo@example.com");
    expect(profile.nickname).toBe("demo");
    expect(profile.avatarBase64).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(profile.hasPassword).toBe(false);
    expect(profile.updatedAt).toBe("2026-03-27T09:05:00.000Z");
  });

  it("优先使用远端 metadata 中的 profile 数据", () => {
    const profile = buildUserProfileFromSession(
      createSession({
        full_name: "产品同学",
        avatar_base64: "data:image/png;base64,abc",
        has_password: true,
        profile_email: "remote@example.com",
        profile_updated_at: "2026-03-27T09:10:00.000Z",
      }),
    );

    expect(profile.email).toBe("remote@example.com");
    expect(profile.nickname).toBe("产品同学");
    expect(profile.avatarBase64).toBe("data:image/png;base64,abc");
    expect(profile.hasPassword).toBe(true);
    expect(profile.updatedAt).toBe("2026-03-27T09:10:00.000Z");
  });
});

describe("createSupabaseAuthService", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }).__APP_SUPABASE_MOCK__;
  });

  it("在完成远端校验前不把缓存资料视为已登录真值", () => {
    const cachedState: PersistedAuthState = {
      profile: {
        id: "user-1",
        email: "demo@example.com",
        nickname: "Demo",
        avatarBase64: "data:image/svg+xml;base64,abc",
        provider: "email",
        emailVerified: true,
        hasPassword: true,
        lastSignInAt: "2026-03-27T09:00:00.000Z",
        updatedAt: "2026-03-27T09:05:00.000Z",
      },
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 1_900_000_000,
      },
      lastSignInEmail: "demo@example.com",
      lastAuthMethod: "otp",
      rememberStartedAt: "2026-03-27T09:00:00.000Z",
      rememberUntil: "2026-04-03T09:00:00.000Z",
      pendingAction: null,
      pendingActionEmail: null,
    };

    localDb.saveAuthState(cachedState);
    const service = createSupabaseAuthService();
    const snapshot = service.getSnapshot();

    expect(snapshot.profile?.email).toBe("demo@example.com");
    expect(snapshot.isLoading).toBe(true);
    expect(snapshot.isAuthenticated).toBe(false);
  });

  it("注册验证码验证成功后直接完成登录并清空挂起动作", async () => {
    const session = createSession();
    const profileUpdatedAt = "2026-03-27T10:00:00.000Z";
    const mockClient = {
      auth: {
        verifyOtp: async () => ({ data: { session }, error: null }),
        updateUser: async ({ data }: { data: Record<string, unknown> }) => ({
          data: {
            user: {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                ...data,
                profile_updated_at: profileUpdatedAt,
              },
            },
          },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    (window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }).__APP_SUPABASE_MOCK__ = mockClient;

    const service = createSupabaseAuthService();
    const result = await service.verifyEmailOtp("demo@example.com", "123456", "register");
    const snapshot = service.getSnapshot();
    const persisted = localDb.getAuthState();

    expect(result.status).toBe("authenticated");
    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.pendingAction).toBeNull();
    expect(snapshot.lastAuthMethod).toBe("otp");
    expect(snapshot.profile?.email).toBe("demo@example.com");
    expect(snapshot.profile?.hasPassword).toBe(false);
    expect(snapshot.profile?.updatedAt).toBe(profileUpdatedAt);
    expect(persisted.pendingAction).toBeNull();
    expect(persisted.pendingActionEmail).toBeNull();
    expect(persisted.rememberUntil).not.toBeNull();
  });
});
