import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { EASE_SMOOTH, buttonTap } from "@/lib/animations";
import { authConfig } from "@/services/auth/auth-config";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/use-auth-store";

type EntryMode = "login" | "register";
type OtpPurpose = "login" | "register" | null;
type LoginMethod = "otp" | "password";

const PANEL = { duration: 0.22, ease: EASE_SMOOTH };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-foreground">{children}</label>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    pendingEmail,
    pendingAction,
    pendingActionEmail,
    lastError,
    authConfigured,
    isLoading,
  } = useAuthStore();

  const [entryMode, setEntryMode] = useState<EntryMode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("otp");
  const [email, setEmail] = useState(pendingActionEmail ?? pendingEmail ?? "");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isClearingPendingAction, setIsClearingPendingAction] = useState(false);

  const hasLegacyResetRecovery = pendingAction === "reset_password";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  useEffect(() => {
    if (pendingActionEmail) {
      setEmail(pendingActionEmail);
    }

    if (pendingAction === "reset_password") {
      setEntryMode("login");
      setLoginMethod("otp");
      setOtpPurpose(null);
      setPassword("");
      setVerificationCode("");
    }
  }, [pendingAction, pendingActionEmail]);

  const currentError = submitError ?? lastError;
  const targetEmail = useMemo(
    () => (pendingActionEmail ?? pendingEmail ?? email).trim().toLowerCase(),
    [email, pendingActionEmail, pendingEmail],
  );
  const pageTitle = hasLegacyResetRecovery
    ? "重新验证账号"
    : entryMode === "register"
      ? "注册账号"
      : "登录账号";

  const ensureValidEmail = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      throw new Error("请输入有效的邮箱地址。");
    }
    return normalized;
  };

  const switchEntryMode = (next: EntryMode) => {
    setEntryMode(next);
    setLoginMethod("otp");
    setSubmitError(null);
    setOtpPurpose(null);
    setPassword("");
    setVerificationCode("");
  };

  const handlePasswordLogin = async () => {
    setIsPasswordLoading(true);
    setSubmitError(null);

    try {
      const normalized = ensureValidEmail(email);
      await authService.signInWithPassword(normalized, password);
      toast.success("登录成功。");
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "密码登录失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsResetLoading(true);
    setSubmitError(null);

    try {
      const normalized = ensureValidEmail(email);
      const result = await authService.requestPasswordReset(normalized);
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送重置邮件失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleRequestOtp = async (purpose: Exclude<OtpPurpose, null>) => {
    setIsEmailLoading(true);
    setSubmitError(null);

    try {
      const normalized = ensureValidEmail(email);
      const result = await authService.requestEmailOtp(normalized, purpose);
      setEmail(normalized);
      setOtpPurpose(purpose);
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送验证码失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otpPurpose) {
      setSubmitError("请先发送验证码。");
      return;
    }

    setIsVerifyLoading(true);
    setSubmitError(null);

    try {
      const result = await authService.verifyEmailOtp(
        ensureValidEmail(targetEmail),
        verificationCode,
        otpPurpose,
      );
      toast.success(result.message);
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "验证码校验失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleClearPendingAction = async () => {
    setIsClearingPendingAction(true);
    setSubmitError(null);

    try {
      await authService.clearPendingAction();
      setEntryMode("login");
      setOtpPurpose(null);
      setVerificationCode("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法取消当前认证流程。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsClearingPendingAction(false);
    }
  };

  const primaryButton = (
    onClick: () => void,
    loading: boolean,
    label: string,
    icon: ReactNode,
    testId?: string,
  ) => (
    <motion.button
      type="button"
      data-testid={testId}
      whileTap={buttonTap}
      onClick={onClick}
      disabled={loading || isLoading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.18)] transition-opacity hover:opacity-90 disabled:opacity-65"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </motion.button>
  );

  const flowBody = () => {
    if (hasLegacyResetRecovery) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-200/60 bg-sky-50/90 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-900/35 dark:bg-sky-950/20 dark:text-sky-200">
            <span className="font-medium">{targetEmail}</span>
            <span className="ml-1">需要先完成验证码登录，之后再到个人资料页设置密码。</span>
          </div>
          <button
            type="button"
            onClick={() => void handleClearPendingAction()}
            disabled={isClearingPendingAction}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-65"
          >
            {isClearingPendingAction ? "正在返回验证码登录…" : "返回验证码登录"}
          </button>
        </div>
      );
    }

    if (entryMode === "register") {
      return (
        <div className="space-y-4">
          <div>
            <FieldLabel>邮箱地址</FieldLabel>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入注册邮箱"
              autoComplete="email"
              className="h-12"
            />
          </div>
          {otpPurpose === "register" ? (
            <div>
              <FieldLabel>验证码</FieldLabel>
              <Input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="请输入邮箱中的 6 位验证码"
                inputMode="numeric"
                className="h-12"
              />
            </div>
          ) : null}
          {otpPurpose === "register"
            ? primaryButton(
                () => void handleVerifyCode(),
                isVerifyLoading,
                "确认注册",
                <ShieldCheck className="h-4 w-4" />,
                "verify-register-otp",
              )
            : primaryButton(
                () => void handleRequestOtp("register"),
                isEmailLoading,
                "发送注册验证码",
                <Mail className="h-4 w-4" />,
                "request-register-otp",
              )}
          <button
            type="button"
            onClick={() => switchEntryMode("login")}
            className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            已有账号，返回登录
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/72 p-1">
          {[
            { value: "otp" as const, label: "验证码登录", icon: Mail },
            { value: "password" as const, label: "密码登录", icon: LockKeyhole },
          ].map((item) => {
            const Icon = item.icon;
            const active = loginMethod === item.value;

            return (
              <button
                key={item.value}
                type="button"
                data-testid={`login-method-${item.value}`}
                onClick={() => {
                  setLoginMethod(item.value);
                  setSubmitError(null);
                  setOtpPurpose(null);
                  setVerificationCode("");
                }}
                className={`flex h-11 items-center justify-center gap-2 rounded-[18px] text-sm transition-colors ${
                  active
                    ? "bg-card text-foreground shadow-[var(--shadow-panel)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div>
          <FieldLabel>邮箱地址</FieldLabel>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="请输入邮箱地址"
            autoComplete="email"
            className="h-12"
          />
        </div>

        {loginMethod === "password" ? (
          <div>
            <FieldLabel>登录密码</FieldLabel>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="请输入登录密码"
              autoComplete="current-password"
              className="h-12"
            />
          </div>
        ) : otpPurpose === "login" ? (
          <div>
            <FieldLabel>验证码</FieldLabel>
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="请输入邮箱中的 6 位验证码"
              inputMode="numeric"
              className="h-12"
            />
          </div>
        ) : null}

        {loginMethod === "password"
          ? primaryButton(
              () => void handlePasswordLogin(),
              isPasswordLoading,
              "登录",
              <KeyRound className="h-4 w-4" />,
              "login-with-password",
            )
          : otpPurpose === "login"
            ? primaryButton(
                () => void handleVerifyCode(),
                isVerifyLoading,
                "验证并登录",
                <ShieldCheck className="h-4 w-4" />,
                "verify-login-otp",
              )
            : primaryButton(
                () => void handleRequestOtp("login"),
                isEmailLoading,
                "发送登录验证码",
                <Mail className="h-4 w-4" />,
                "request-login-otp",
              )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          {loginMethod === "password" ? (
            <button
              type="button"
              data-testid="request-password-reset"
              onClick={() => void handlePasswordReset()}
              disabled={isResetLoading}
              className="underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60"
            >
              {isResetLoading ? "正在发送重置邮件…" : "忘记密码"}
            </button>
          ) : otpPurpose === "login" ? (
            <button
              type="button"
              onClick={() => void handleRequestOtp("login")}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              重新发送验证码
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => switchEntryMode("register")}
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            没有账号，去注册
          </button>
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,113,227,0.08),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(2,6,23,0.9))] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center">
        <section className="w-full rounded-[32px] border border-border/80 bg-card/96 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-7">
          <div className="text-center">
            <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.4rem]">
              {pageTitle}
            </h1>
          </div>

          {!hasLegacyResetRecovery ? (
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/72 p-1">
              {[
                { value: "login" as const, label: "登录" },
                { value: "register" as const, label: "注册" },
              ].map((item) => {
                const active = entryMode === item.value;
                return (
                  <motion.button
                    key={item.value}
                    type="button"
                    data-testid={`entry-mode-${item.value}`}
                    whileTap={buttonTap}
                    onClick={() => switchEntryMode(item.value)}
                    className={`h-11 rounded-[18px] text-sm font-medium transition-colors ${
                      active
                        ? "bg-card text-foreground shadow-[var(--shadow-panel)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${entryMode}-${pendingAction}-${otpPurpose}-${loginMethod}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={PANEL}
                className="space-y-4"
              >
                {currentError ? (
                  <motion.div
                    key={currentError}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={PANEL}
                    className="rounded-2xl border border-rose-200/60 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-800 dark:border-rose-900/35 dark:bg-rose-950/20 dark:text-rose-200"
                  >
                    {currentError}
                  </motion.div>
                ) : null}
                {flowBody()}
              </motion.div>
            </AnimatePresence>
          </div>

          {!authConfigured ? (
            <section className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50/90 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-amber-900/35 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="font-medium">邮箱认证尚未配置完成</div>
              <div className="mt-2">
                请先配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_SUPABASE_EMAIL_REDIRECT_TO`。
              </div>
              <div className="mt-1">密码重置回流可选配置：`VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO`。</div>
              <div className="mt-2 break-all text-xs">当前认证回跳地址：{authConfig.emailRedirectTo}</div>
            </section>
          ) : null}
        </section>
      </div>
    </PageTransition>
  );
}
