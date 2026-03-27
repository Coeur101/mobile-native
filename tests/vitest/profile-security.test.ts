import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAuthService } from "@/services/auth/supabase-auth-service";

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

describe("profile security service", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }).__APP_SUPABASE_MOCK__;
  });

  it("updates the profile avatar metadata through Supabase auth", async () => {
    let currentSession = createSession({
      full_name: "Demo User",
      avatar_base64: "data:image/svg+xml;base64,old-avatar",
      has_password: false,
      profile_email: "demo@example.com",
      profile_updated_at: "2026-03-27T09:05:00.000Z",
    });

    const mockClient = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: currentSession }, error: null })),
        updateUser: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          currentSession = {
            ...currentSession,
            user: {
              ...currentSession.user,
              user_metadata: {
                ...currentSession.user.user_metadata,
                ...data,
              },
            },
          } as Session;

          return {
            data: { user: currentSession.user },
            error: null,
          };
        }),
      },
    } as unknown as SupabaseClient;

    (window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }).__APP_SUPABASE_MOCK__ = mockClient;

    const service = createSupabaseAuthService();
    const profile = await service.updateProfile({
      avatarBase64: "data:image/webp;base64,new-avatar",
    });

    expect(profile.avatarBase64).toBe("data:image/webp;base64,new-avatar");
    expect(service.getSnapshot().profile?.avatarBase64).toBe("data:image/webp;base64,new-avatar");
    expect(mockClient.auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it("sends a reauthentication code and updates the password with a nonce", async () => {
    let currentSession = createSession({
      full_name: "Demo User",
      avatar_base64: "data:image/svg+xml;base64,avatar",
      has_password: false,
      profile_email: "demo@example.com",
      profile_updated_at: "2026-03-27T09:05:00.000Z",
    });

    const reauthenticate = vi.fn(async () => ({ data: { user: null, session: null }, error: null }));
    const updateUser = vi.fn(
      async ({ password, nonce, data }: { password?: string; nonce?: string; data?: Record<string, unknown> }) => {
        currentSession = {
          ...currentSession,
          user: {
            ...currentSession.user,
            user_metadata: {
              ...currentSession.user.user_metadata,
              ...data,
            },
          },
        } as Session;

        return {
          data: { user: currentSession.user },
          error: null,
        };
      },
    );

    const mockClient = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: currentSession }, error: null })),
        reauthenticate,
        updateUser,
      },
    } as unknown as SupabaseClient;

    (window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }).__APP_SUPABASE_MOCK__ = mockClient;

    const service = createSupabaseAuthService();
    const otpResult = await service.requestPasswordReauthentication();
    await service.updatePasswordWithNonce("supersafe-password", "654321");

    expect(otpResult.email).toBe("demo@example.com");
    expect(reauthenticate).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "supersafe-password",
        nonce: "654321",
      }),
    );
    expect(service.getSnapshot().profile?.hasPassword).toBe(true);
  });
});