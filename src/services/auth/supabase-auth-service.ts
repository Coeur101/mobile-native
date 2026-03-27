import type { AuthChangeEvent, Session, SupabaseClient } from "@supabase/supabase-js";
import { localDb } from "@/lib/local-db";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  AuthMethod,
  AuthSession,
  AuthStateSnapshot,
  EmailOtpVerificationResult,
  PasswordRecoveryResult,
  PendingAuthAction,
  PersistedAuthState,
  UserProfile,
} from "@/types";
import type { AuthService, AuthStateListener, EmailOtpPurpose } from "./auth-service";
import { authConfig, getAuthConfigurationError } from "./auth-config";

export const AUTH_REMEMBER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type ProfileMetadata = {
  full_name?: string;
  avatar_base64?: string;
  has_password?: boolean;
  profile_email?: string;
  profile_updated_at?: string;
};

const DEFAULT_AVATAR_PALETTES = [
  ["#F97316", "#FB7185"],
  ["#0EA5E9", "#6366F1"],
  ["#10B981", "#14B8A6"],
  ["#8B5CF6", "#EC4899"],
  ["#F59E0B", "#EF4444"],
];

function toAuthSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

export function buildNickname(email: string): string {
  const [name] = email.split("@");
  return name || "Email User";
}

function getProfileMetadata(session: Session): ProfileMetadata {
  const metadata = session.user.user_metadata;
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return {
    full_name: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
    avatar_base64:
      typeof metadata.avatar_base64 === "string" ? metadata.avatar_base64 : undefined,
    has_password:
      typeof metadata.has_password === "boolean" ? metadata.has_password : undefined,
    profile_email:
      typeof metadata.profile_email === "string" ? metadata.profile_email : undefined,
    profile_updated_at:
      typeof metadata.profile_updated_at === "string"
        ? metadata.profile_updated_at
        : undefined,
  };
}

function hashSeed(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function buildAvatarInitials(email: string, nickname: string) {
  const seed = nickname.trim() || buildNickname(email);
  const parts = seed
    .split(/[\s_-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : seed.slice(0, 2);
  return initials.toUpperCase();
}

function encodeBase64(value: string) {
  if (typeof btoa === "function") {
    let binary = "";
    for (const byte of new TextEncoder().encode(value)) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  const nodeBuffer = (globalThis as typeof globalThis & {
    Buffer?: { from(input: string, encoding: string): { toString(encoding: string): string } };
  }).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(value, "utf8").toString("base64");
  }

  throw new Error("No base64 encoder available.");
}

export function buildDefaultAvatarDataUrl(email: string, nickname = buildNickname(email)) {
  const palette =
    DEFAULT_AVATAR_PALETTES[hashSeed(email.toLowerCase()) % DEFAULT_AVATAR_PALETTES.length];
  const initials = buildAvatarInitials(email, nickname);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">',
    `<defs><linearGradient id="avatar-gradient" x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient></defs>`,
    '<rect width="96" height="96" rx="28" fill="url(#avatar-gradient)"/>',
    '<circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.24)"/>',
    '<path d="M22 80c4-14 14-22 26-22s22 8 26 22" fill="rgba(255,255,255,0.18)"/>',
    `<text x="48" y="56" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="700">${initials}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;base64,${encodeBase64(svg)}`;
}

function buildProfileUpdatedAt(session: Session) {
  return session.user.updated_at ?? session.user.last_sign_in_at ?? new Date().toISOString();
}

export function buildUserProfileFromSession(session: Session): UserProfile {
  const metadata = getProfileMetadata(session);
  const email = metadata.profile_email ?? session.user.email ?? "";
  const nickname =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : buildNickname(email);

  return {
    id: session.user.id,
    email,
    nickname,
    avatarBase64:
      typeof metadata.avatar_base64 === "string" && metadata.avatar_base64.trim()
        ? metadata.avatar_base64
        : buildDefaultAvatarDataUrl(email, nickname),
    provider: "email",
    emailVerified: Boolean(session.user.email_confirmed_at),
    hasPassword: metadata.has_password === true,
    lastSignInAt: session.user.last_sign_in_at ?? null,
    updatedAt: metadata.profile_updated_at ?? buildProfileUpdatedAt(session),
  };
}

function buildDesiredProfileMetadata(
  session: Session,
  overrides: Partial<ProfileMetadata> = {},
): Required<ProfileMetadata> {
  const profile = buildUserProfileFromSession(session);
  return {
    full_name: overrides.full_name ?? profile.nickname,
    avatar_base64: overrides.avatar_base64 ?? profile.avatarBase64,
    has_password: overrides.has_password ?? profile.hasPassword,
    profile_email: overrides.profile_email ?? profile.email,
    profile_updated_at: overrides.profile_updated_at ?? profile.updatedAt,
  };
}

function getProfileMetadataPatch(
  current: ProfileMetadata,
  desired: Required<ProfileMetadata>,
): ProfileMetadata {
  const patch: ProfileMetadata = {};

  if (current.full_name !== desired.full_name) patch.full_name = desired.full_name;
  if (current.avatar_base64 !== desired.avatar_base64) {
    patch.avatar_base64 = desired.avatar_base64;
  }
  if (current.has_password !== desired.has_password) patch.has_password = desired.has_password;
  if (current.profile_email !== desired.profile_email) patch.profile_email = desired.profile_email;
  if (current.profile_updated_at !== desired.profile_updated_at) {
    patch.profile_updated_at = desired.profile_updated_at;
  }

  return patch;
}

async function syncRemoteProfile(
  client: SupabaseClient,
  session: Session,
  overrides: Partial<ProfileMetadata> = {},
) {
  const current = getProfileMetadata(session);
  const desired = buildDesiredProfileMetadata(session, overrides);
  const patch = getProfileMetadataPatch(current, desired);

  if (Object.keys(patch).length === 0) {
    return session;
  }

  const { data, error } = await client.auth.updateUser({
    data: patch,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user ? ({ ...session, user: data.user } as Session) : session;
}

function getRememberWindow(now = Date.now()) {
  return {
    rememberStartedAt: new Date(now).toISOString(),
    rememberUntil: new Date(now + AUTH_REMEMBER_DURATION_MS).toISOString(),
  };
}

export function hasRememberWindowExpired(
  persistedState: Pick<PersistedAuthState, "rememberUntil">,
  now = Date.now(),
): boolean {
  if (!persistedState.rememberUntil) {
    return false;
  }

  const expiresAt = Date.parse(persistedState.rememberUntil);
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

function getCleanLoginUrl(): string {
  if (typeof window === "undefined") {
    return "/login";
  }

  return `${window.location.origin}/login`;
}

function getCallbackActionFromUrl(): PendingAuthAction {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const mode = params.get("mode");

  if (type === "recovery" || mode === "recovery") {
    return "reset_password";
  }

  return null;
}

function hasAuthCallbackQuery(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error_description") || params.has("error");
}

function validatePassword(password: string, label = "密码") {
  if (!password.trim()) {
    throw new Error(`请输入${label}。`);
  }

  if (password.trim().length < 8) {
    throw new Error(`${label}至少需要 8 位字符。`);
  }
}

type SyncOptions = {
  errorMessage?: string | null;
  pendingAction?: PendingAuthAction;
  pendingActionEmail?: string | null;
  lastAuthMethod?: AuthMethod | null;
  refreshRememberWindow?: boolean;
};

export function createSupabaseAuthService(): AuthService {
  const persisted = localDb.getAuthState();
  let snapshot: AuthStateSnapshot = {
    profile: persisted.profile,
    session: persisted.session,
    isLoading: true,
    // Cached profile data can be shown as a fallback, but auth truth is
    // established only after Supabase session/profile reconciliation.
    isAuthenticated: false,
    pendingEmail: persisted.lastSignInEmail,
    pendingAction: persisted.pendingAction,
    pendingActionEmail: persisted.pendingActionEmail,
    lastAuthMethod: persisted.lastAuthMethod,
    rememberUntil: persisted.rememberUntil,
    lastError: null,
    authConfigured: authConfig.isConfigured,
  };
  let initialized = false;
  let initializePromise: Promise<void> | null = null;
  let unsubscribeAuthListener: (() => void) | null = null;
  const listeners = new Set<AuthStateListener>();

  const emitChange = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const persistSnapshot = () => {
    localDb.saveAuthState({
      profile: snapshot.profile,
      session: snapshot.session,
      lastSignInEmail: snapshot.pendingEmail,
      lastAuthMethod: snapshot.lastAuthMethod,
      rememberStartedAt: localDb.getAuthState().rememberStartedAt,
      rememberUntil: snapshot.rememberUntil,
      pendingAction: snapshot.pendingAction,
      pendingActionEmail: snapshot.pendingActionEmail,
    });
  };

  const setSnapshot = (
    next: Partial<AuthStateSnapshot>,
    persistedOverrides?: Partial<PersistedAuthState>,
  ) => {
    const previousPersisted = localDb.getAuthState();
    const nextPersisted: PersistedAuthState = {
      profile: next.profile ?? snapshot.profile,
      session: next.session ?? snapshot.session,
      lastSignInEmail: next.pendingEmail ?? snapshot.pendingEmail,
      lastAuthMethod: next.lastAuthMethod ?? snapshot.lastAuthMethod,
      rememberStartedAt:
        persistedOverrides?.rememberStartedAt ?? previousPersisted.rememberStartedAt ?? null,
      rememberUntil: next.rememberUntil ?? snapshot.rememberUntil,
      pendingAction: next.pendingAction ?? snapshot.pendingAction,
      pendingActionEmail: next.pendingActionEmail ?? snapshot.pendingActionEmail,
    };

    localDb.saveAuthState(nextPersisted);

    snapshot = {
      ...snapshot,
      ...next,
      pendingEmail: nextPersisted.lastSignInEmail,
      pendingAction: nextPersisted.pendingAction,
      pendingActionEmail: nextPersisted.pendingActionEmail,
      lastAuthMethod: nextPersisted.lastAuthMethod,
      rememberUntil: nextPersisted.rememberUntil,
      authConfigured: authConfig.isConfigured,
    };
    snapshot.isAuthenticated = Boolean(
      nextPersisted.profile && nextPersisted.session && !nextPersisted.pendingAction,
    );
    emitChange();
  };

  const clearAuthState = (lastError: string | null = null) => {
    localDb.saveAuthState({
      profile: null,
      session: null,
      lastSignInEmail: snapshot.pendingEmail,
      lastAuthMethod: snapshot.lastAuthMethod,
      rememberStartedAt: null,
      rememberUntil: null,
      pendingAction: null,
      pendingActionEmail: null,
    });
    snapshot = {
      ...snapshot,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      pendingAction: null,
      pendingActionEmail: null,
      rememberUntil: null,
      lastError,
      authConfigured: authConfig.isConfigured,
    };
    emitChange();
  };

  const syncSession = (session: Session | null, options: SyncOptions = {}) => {
    const previousPersisted = localDb.getAuthState();
    const pendingAction =
      options.pendingAction !== undefined
        ? options.pendingAction
        : previousPersisted.pendingAction ?? null;
    const pendingActionEmail =
      options.pendingActionEmail !== undefined
        ? options.pendingActionEmail
        : pendingAction
          ? session?.user.email ?? previousPersisted.pendingActionEmail
          : null;
    const rememberWindow = options.refreshRememberWindow ? getRememberWindow() : null;

    const nextPersisted: PersistedAuthState = session
      ? {
          profile: buildUserProfileFromSession(session),
          session: toAuthSession(session),
          lastSignInEmail: session.user.email ?? previousPersisted.lastSignInEmail,
          lastAuthMethod: options.lastAuthMethod ?? previousPersisted.lastAuthMethod,
          rememberStartedAt: rememberWindow?.rememberStartedAt ?? previousPersisted.rememberStartedAt,
          rememberUntil: rememberWindow?.rememberUntil ?? previousPersisted.rememberUntil,
          pendingAction,
          pendingActionEmail,
        }
      : {
          profile: null,
          session: null,
          lastSignInEmail: previousPersisted.lastSignInEmail,
          lastAuthMethod: options.lastAuthMethod ?? previousPersisted.lastAuthMethod,
          rememberStartedAt: null,
          rememberUntil: null,
          pendingAction: null,
          pendingActionEmail: null,
        };

    localDb.saveAuthState(nextPersisted);
    snapshot = {
      ...snapshot,
      profile: nextPersisted.profile,
      session: nextPersisted.session,
      pendingEmail: nextPersisted.lastSignInEmail,
      pendingAction: nextPersisted.pendingAction,
      pendingActionEmail: nextPersisted.pendingActionEmail,
      lastAuthMethod: nextPersisted.lastAuthMethod,
      rememberUntil: nextPersisted.rememberUntil,
      lastError: options.errorMessage ?? null,
      isLoading: false,
      authConfigured: authConfig.isConfigured,
      isAuthenticated: Boolean(nextPersisted.profile && nextPersisted.session && !nextPersisted.pendingAction),
    };
    emitChange();
  };

  const consumeCallbackIfNeeded = async (): Promise<{
    errorMessage: string | null;
    pendingAction: PendingAuthAction;
  }> => {
    const client = getSupabaseBrowserClient();
    if (!client || typeof window === "undefined" || !hasAuthCallbackQuery()) {
      return {
        errorMessage: null,
        pendingAction: null,
      };
    }

    const url = new URL(window.location.href);
    const pendingAction = getCallbackActionFromUrl();
    const errorDescription = url.searchParams.get("error_description");
    if (errorDescription) {
      window.history.replaceState({}, document.title, getCleanLoginUrl());
      return {
        errorMessage: errorDescription,
        pendingAction,
      };
    }

    const code = url.searchParams.get("code");
    if (!code) {
      return {
        errorMessage: null,
        pendingAction,
      };
    }

    const { error } = await client.auth.exchangeCodeForSession(code);
    window.history.replaceState({}, document.title, getCleanLoginUrl());
    return {
      errorMessage: error?.message ?? null,
      pendingAction,
    };
  };

  const handleAuthChange = (event: AuthChangeEvent, session: Session | null) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      syncSession(session, {
        pendingAction: "reset_password",
        pendingActionEmail: session.user.email ?? null,
      });
      return;
    }

    if (event === "SIGNED_OUT") {
      clearAuthState(null);
      return;
    }

    syncSession(session, {
      pendingAction: session ? localDb.getAuthState().pendingAction : null,
      pendingActionEmail: session ? localDb.getAuthState().pendingActionEmail : null,
      lastAuthMethod: localDb.getAuthState().lastAuthMethod,
    });
  };

  return {
    async initialize() {
      if (initialized) {
        return;
      }

      if (initializePromise) {
        return initializePromise;
      }

      initializePromise = (async () => {
        const client = getSupabaseBrowserClient();
        if (!client && !authConfig.isConfigured) {
          clearAuthState(null);
          initialized = true;
          return;
        }

        if (!client) {
          clearAuthState(getAuthConfigurationError());
          initialized = true;
          return;
        }

        if (hasRememberWindowExpired(localDb.getAuthState())) {
          await client.auth.signOut();
          clearAuthState("本地登录信息已超过 7 天，已为你清理，请重新登录。");
          initialized = true;
          return;
        }

        const callbackResult = await consumeCallbackIfNeeded();
        const {
          data: { session },
          error,
        } = await client.auth.getSession();
        const resolvedSession = session ? await syncRemoteProfile(client, session) : session;

        syncSession(resolvedSession, {
          errorMessage: callbackResult.errorMessage ?? error?.message ?? null,
          pendingAction: callbackResult.pendingAction ?? localDb.getAuthState().pendingAction,
          pendingActionEmail:
            callbackResult.pendingAction === "reset_password"
              ? resolvedSession?.user.email ?? localDb.getAuthState().pendingActionEmail
              : localDb.getAuthState().pendingActionEmail,
          lastAuthMethod: localDb.getAuthState().lastAuthMethod,
        });

        if (!unsubscribeAuthListener) {
          const { data } = client.auth.onAuthStateChange(handleAuthChange);
          unsubscribeAuthListener = () => data.subscription.unsubscribe();
        }

        initialized = true;
      })();

      return initializePromise.finally(() => {
        initializePromise = null;
      });
    },

    getCurrentUser() {
      return snapshot.profile;
    },

    getSnapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async requestEmailOtp(email, purpose) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("请输入邮箱地址。");
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        const message = getAuthConfigurationError();
        setSnapshot({
          lastError: message,
          pendingEmail: normalizedEmail,
        });
        throw new Error(message);
      }

      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: authConfig.emailRedirectTo,
          shouldCreateUser: purpose === "register",
        },
      });

      if (error) {
        setSnapshot({
          lastError: error.message,
          pendingEmail: normalizedEmail,
        });
        throw new Error(error.message);
      }

      setSnapshot(
        {
          pendingEmail: normalizedEmail,
          pendingAction: null,
          pendingActionEmail: null,
          lastAuthMethod: "otp",
          lastError: null,
        },
        {
          pendingAction: null,
          pendingActionEmail: null,
          lastAuthMethod: "otp",
        },
      );

      return {
        status: "code_sent" as const,
        email: normalizedEmail,
        message:
          purpose === "register"
            ? "注册验证码已发送，请先完成邮箱验证。"
            : "登录验证码已发送，请检查邮箱。",
      };
    },

    async verifyEmailOtp(
      email: string,
      token: string,
      purpose: EmailOtpPurpose,
    ): Promise<EmailOtpVerificationResult> {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedToken = token.trim();

      if (!normalizedEmail) {
        throw new Error("??????????");
      }

      if (!normalizedToken) {
        throw new Error("?????????");
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(getAuthConfigurationError());
      }

      const {
        data: { session },
        error,
      } = await client.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedToken,
        type: "email",
      });

      if (error) {
        setSnapshot({
          lastError: error.message,
          pendingEmail: normalizedEmail,
        });
        throw new Error(error.message);
      }

      const resolvedSession = session
        ? await syncRemoteProfile(client, session, {
            profile_email: normalizedEmail,
            full_name: buildNickname(normalizedEmail),
            avatar_base64: buildDefaultAvatarDataUrl(normalizedEmail),
            has_password: false,
            profile_updated_at: new Date().toISOString(),
          })
        : session;

      syncSession(resolvedSession, {
        pendingAction: null,
        pendingActionEmail: null,
        refreshRememberWindow: true,
        lastAuthMethod: "otp",
      });

      return {
        status: "authenticated",
        email: normalizedEmail,
        message:
          purpose === "register"
            ? "????????????????????"
            : "???????????????",
      };
    },

    async completeRegistration(password: string, nickname?: string) {
      validatePassword(password, "登录密码");

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(getAuthConfigurationError());
      }

      const trimmedNickname = nickname?.trim();
      const { error } = await client.auth.updateUser({
        password: password.trim(),
        data: {
          ...(trimmedNickname ? { full_name: trimmedNickname } : {}),
          has_password: true,
          profile_updated_at: new Date().toISOString(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { session },
      } = await client.auth.getSession();
      const resolvedSession = session
        ? await syncRemoteProfile(client, session, {
            ...(trimmedNickname ? { full_name: trimmedNickname } : {}),
            has_password: true,
            profile_updated_at: new Date().toISOString(),
          })
        : session;

      syncSession(resolvedSession, {
        pendingAction: null,
        pendingActionEmail: null,
        refreshRememberWindow: true,
        lastAuthMethod: "password",
      });
    },

    async requestPasswordReset(email: string): Promise<PasswordRecoveryResult> {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("请输入邮箱地址。");
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(getAuthConfigurationError());
      }

      const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: authConfig.passwordResetRedirectTo,
      });

      if (error) {
        setSnapshot({
          lastError: error.message,
          pendingEmail: normalizedEmail,
        });
        throw new Error(error.message);
      }

      setSnapshot(
        {
          pendingEmail: normalizedEmail,
          lastAuthMethod: "password",
          lastError: null,
        },
        {
          lastAuthMethod: "password",
        },
      );

      return {
        email: normalizedEmail,
        message: "密码重置邮件已发送，请在邮箱中打开重置链接。",
      };
    },

    async completePasswordReset(password: string) {
      validatePassword(password, "新密码");

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(getAuthConfigurationError());
      }

      const { error } = await client.auth.updateUser({
        password: password.trim(),
        data: {
          has_password: true,
          profile_updated_at: new Date().toISOString(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { session },
      } = await client.auth.getSession();
      const resolvedSession = session
        ? await syncRemoteProfile(client, session, {
            has_password: true,
            profile_updated_at: new Date().toISOString(),
          })
        : session;

      syncSession(resolvedSession, {
        pendingAction: null,
        pendingActionEmail: null,
        refreshRememberWindow: true,
        lastAuthMethod: "password",
      });
    },

    async clearPendingAction() {
      const client = getSupabaseBrowserClient();
      if (client) {
        await client.auth.signOut();
      }

      clearAuthState(null);
    },

    async signOut() {
      const client = getSupabaseBrowserClient();
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) {
          throw new Error(error.message);
        }
      }

      clearAuthState(null);
    },
  };
}
