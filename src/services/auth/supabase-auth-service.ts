import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
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

function toAuthSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

function buildNickname(email: string): string {
  const [name] = email.split("@");
  return name || "Email User";
}

function toUserProfile(session: Session): UserProfile {
  const email = session.user.email ?? "";

  return {
    id: session.user.id,
    email,
    nickname:
      typeof session.user.user_metadata?.full_name === "string" &&
      session.user.user_metadata.full_name.trim()
        ? session.user.user_metadata.full_name.trim()
        : buildNickname(email),
    provider: "email",
    emailVerified: Boolean(session.user.email_confirmed_at),
    lastSignInAt: session.user.last_sign_in_at ?? null,
  };
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
    isAuthenticated: Boolean(persisted.profile && persisted.session && !persisted.pendingAction),
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
          profile: toUserProfile(session),
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

        syncSession(session, {
          errorMessage: callbackResult.errorMessage ?? error?.message ?? null,
          pendingAction: callbackResult.pendingAction ?? localDb.getAuthState().pendingAction,
          pendingActionEmail:
            callbackResult.pendingAction === "reset_password"
              ? session?.user.email ?? localDb.getAuthState().pendingActionEmail
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
        throw new Error("缺少待验证邮箱。");
      }

      if (!normalizedToken) {
        throw new Error("请输入邮箱验证码。");
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

      if (purpose === "register") {
        syncSession(session, {
          pendingAction: "complete_registration",
          pendingActionEmail: normalizedEmail,
          lastAuthMethod: "password",
        });
        return {
          status: "password_setup_required",
          email: normalizedEmail,
          message: "邮箱验证成功，请继续设置登录密码。",
        };
      }

      syncSession(session, {
        pendingAction: null,
        pendingActionEmail: null,
        refreshRememberWindow: true,
        lastAuthMethod: "otp",
      });

      return {
        status: "authenticated",
        email: normalizedEmail,
        message: "验证码验证成功，正在进入应用。",
      };
    },

    async signInWithPassword(email: string, password: string) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("请输入邮箱地址。");
      }
      validatePassword(password);

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(getAuthConfigurationError());
      }

      const {
        data: { session },
        error,
      } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim(),
      });

      if (error) {
        setSnapshot({
          lastError: error.message,
          pendingEmail: normalizedEmail,
        });
        throw new Error(error.message);
      }

      syncSession(session, {
        pendingAction: null,
        pendingActionEmail: null,
        refreshRememberWindow: true,
        lastAuthMethod: "password",
      });
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
        data: trimmedNickname ? { full_name: trimmedNickname } : undefined,
      });

      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      syncSession(session, {
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
      });

      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      syncSession(session, {
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
