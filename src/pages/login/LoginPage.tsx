import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { authService } from "@/services/auth";
import { authConfig } from "@/services/auth/auth-config";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { useAuthStore } from "@/stores/use-auth-store";

type AuthMode = "otp_login" | "password_login" | "register" | "reset_request";
type OtpPurpose = "login" | "register" | null;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordPair(password: string, confirmPassword?: string): string | null {
  if (password.trim().length < 8) {
    return "密码至少需要 8 位字符。";
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }

  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    pendingEmail,
    pendingAction,
    pendingActionEmail,
    lastAuthMethod,
    lastError,
    authConfigured,
    isLoading,
    rememberUntil,
  } = useAuthStore();
  const [authMode, setAuthMode] = useState<AuthMode>(
    pendingAction === "complete_registration"
      ? "register"
      : pendingAction === "reset_password"
        ? "reset_request"
        : lastAuthMethod === "password"
          ? "password_login"
          : "otp_login",
  );
  const [email, setEmail] = useState(pendingActionEmail ?? pendingEmail ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isClearingPendingAction, setIsClearingPendingAction] = useState(false);

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

    if (pendingAction === "complete_registration") {
      setAuthMode("register");
      setOtpPurpose(null);
    }

    if (pendingAction === "reset_password") {
      setAuthMode("reset_request");
      setOtpPurpose(null);
    }
  }, [pendingAction, pendingActionEmail]);

  const currentError = submitError ?? lastError;
  const targetEmail = useMemo(
    () => (pendingActionEmail ?? pendingEmail ?? email).trim().toLowerCase(),
    [email, pendingActionEmail, pendingEmail],
  );
  const isRegistrationPasswordStep = pendingAction === "complete_registration";
  const isResetPasswordStep = pendingAction === "reset_password";
  const rememberedUntilLabel = rememberUntil
    ? new Date(rememberUntil).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const ensureValidEmail = (value: string) => {
    const normalizedEmail = value.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new Error("请输入有效的邮箱地址。");
    }
    return normalizedEmail;
  };

  const handleRequestOtp = async (purpose: Exclude<OtpPurpose, null>) => {
    setIsEmailLoading(true);
    setSubmitError(null);

    try {
      const normalizedEmail = ensureValidEmail(email);
      const result = await authService.requestEmailOtp(normalizedEmail, purpose);
      setEmail(normalizedEmail);
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
      const message = "请先发送验证码。";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    setIsVerifyLoading(true);
    setSubmitError(null);

    try {
      const normalizedEmail = ensureValidEmail(targetEmail);
      const result = await authService.verifyEmailOtp(
        normalizedEmail,
        verificationCode,
        otpPurpose,
      );
      if (result.status === "password_setup_required") {
        toast.success(result.message);
        setPassword("");
        setConfirmPassword("");
        return;
      }

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

  const handlePasswordLogin = async () => {
    setIsPasswordLoading(true);
    setSubmitError(null);

    try {
      const normalizedEmail = ensureValidEmail(email);
      const validationError = validatePasswordPair(password);
      if (validationError) {
        throw new Error(validationError);
      }

      await authService.signInWithPassword(normalizedEmail, password);
      toast.success("密码登录成功，正在进入应用。");
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "密码登录失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setIsPasswordLoading(true);
    setSubmitError(null);

    try {
      const validationError = validatePasswordPair(password, confirmPassword);
      if (validationError) {
        throw new Error(validationError);
      }

      await authService.completeRegistration(password, nickname);
      toast.success("注册完成，已为你保留 7 天登录态。");
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "设置密码失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsResetLoading(true);
    setSubmitError(null);

    try {
      const normalizedEmail = ensureValidEmail(email);
      const result = await authService.requestPasswordReset(normalizedEmail);
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送重置邮件失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleCompletePasswordReset = async () => {
    setIsPasswordLoading(true);
    setSubmitError(null);

    try {
      const validationError = validatePasswordPair(password, confirmPassword);
      if (validationError) {
        throw new Error(validationError);
      }

      await authService.completePasswordReset(password);
      toast.success("密码已更新，正在返回应用。");
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "重置密码失败，请稍后重试。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleClearPendingAction = async () => {
    setIsClearingPendingAction(true);
    setSubmitError(null);

    try {
      await authService.clearPendingAction();
      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setOtpPurpose(null);
      setAuthMode("otp_login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法取消当前认证流程。";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsClearingPendingAction(false);
    }
  };

  const renderStepCard = () => {
    if (isRegistrationPasswordStep) {
      return (
        <section className="rounded-3xl border border-emerald-200/50 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            完成注册
          </div>
          <p className="mb-4 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
            邮箱 <span className="font-medium">{targetEmail}</span> 已验证成功。现在设置登录密码，之后你可以直接用密码或验证码登录。
          </p>
          <div className="space-y-3">
            <Input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="昵称（可选）"
              className="h-11 rounded-2xl bg-background"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="设置 8 位以上密码"
              autoComplete="new-password"
              className="h-11 rounded-2xl bg-background"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入密码"
              autoComplete="new-password"
              className="h-11 rounded-2xl bg-background"
            />
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleCompleteRegistration()}
              disabled={isPasswordLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70"
            >
              {isPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              完成注册并进入应用
            </motion.button>
            <button
              type="button"
              onClick={() => void handleClearPendingAction()}
              disabled={isClearingPendingAction}
              className="w-full text-center text-xs text-emerald-800/80 underline-offset-2 hover:underline dark:text-emerald-300/90"
            >
              放弃本次注册，返回登录
            </button>
          </div>
        </section>
      );
    }

    if (isResetPasswordStep) {
      return (
        <section className="rounded-3xl border border-sky-200/50 bg-sky-50/70 p-4 dark:border-sky-900/30 dark:bg-sky-950/20">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-900 dark:text-sky-200">
            <KeyRound className="h-4 w-4" />
            重置密码
          </div>
          <p className="mb-4 text-sm leading-6 text-sky-800 dark:text-sky-300">
            请为 <span className="font-medium">{targetEmail}</span> 设置新的登录密码。更新成功后会自动恢复登录状态。
          </p>
          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入新密码"
              autoComplete="new-password"
              className="h-11 rounded-2xl bg-background"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              autoComplete="new-password"
              className="h-11 rounded-2xl bg-background"
            />
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleCompletePasswordReset()}
              disabled={isPasswordLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70"
            >
              {isPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              保存新密码
            </motion.button>
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-3xl border border-border bg-secondary/60 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Mail className="h-4 w-4 text-primary" />
          邮箱认证
        </div>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-11 rounded-2xl"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {([
            { value: "otp_login", label: "验证码登录" },
            { value: "password_login", label: "密码登录" },
            { value: "register", label: "注册账号" },
            { value: "reset_request", label: "找回密码" },
          ] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setAuthMode(item.value)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                authMode === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {authMode === "otp_login" ? (
          <div className="mt-4 space-y-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleRequestOtp("login")}
              disabled={isEmailLoading || isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isEmailLoading || isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              发送登录验证码
            </motion.button>

            {otpPurpose === "login" ? (
              <>
                <Input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="输入邮箱中的 6 位验证码"
                  inputMode="numeric"
                  className="h-11 rounded-2xl bg-background"
                />
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => void handleVerifyCode()}
                  disabled={isVerifyLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:border-primary/30 disabled:cursor-wait disabled:opacity-70"
                >
                  {isVerifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  验证并登录
                </motion.button>
              </>
            ) : null}
          </div>
        ) : null}

        {authMode === "password_login" ? (
          <div className="mt-4 space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入登录密码"
              autoComplete="current-password"
              className="h-11 rounded-2xl bg-background"
            />
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handlePasswordLogin()}
              disabled={isPasswordLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              使用密码登录
            </motion.button>
            <button
              type="button"
              onClick={() => setAuthMode("reset_request")}
              className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              忘记密码，发送重置邮件
            </button>
          </div>
        ) : null}

        {authMode === "register" ? (
          <div className="mt-4 space-y-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleRequestOtp("register")}
              disabled={isEmailLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              发送注册验证码
            </motion.button>
            <p className="text-xs leading-5 text-muted-foreground">
              第一步先验证邮箱，第二步再设置密码。这样更适合手机端输入，不需要一次填完所有字段。
            </p>
            {otpPurpose === "register" ? (
              <>
                <Input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="输入注册验证码"
                  inputMode="numeric"
                  className="h-11 rounded-2xl bg-background"
                />
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => void handleVerifyCode()}
                  disabled={isVerifyLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:border-primary/30 disabled:cursor-wait disabled:opacity-70"
                >
                  {isVerifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  验证邮箱，进入设密步骤
                </motion.button>
              </>
            ) : null}
          </div>
        ) : null}

        {authMode === "reset_request" ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs leading-5 text-muted-foreground">
              我们会向你的邮箱发送密码重置邮件。点击邮件中的链接后，会自动回到当前登录页继续设置新密码。
            </p>
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleRequestPasswordReset()}
              disabled={isResetLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isResetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              发送重置邮件
            </motion.button>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <PageTransition className="min-h-screen px-4 py-8" style={{ background: "var(--gradient-warm-bg)" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-[20%] -top-[10%] h-[50vh] w-[50vh] rounded-full bg-[#8B5CF6]/10 blur-[100px] dark:bg-[#A78BFA]/5" />
        <div className="absolute -bottom-[15%] -left-[15%] h-[60vh] w-[60vh] rounded-full bg-[#EC4899]/8 blur-[100px] dark:bg-[#F472B6]/4" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between rounded-[28px] border border-border bg-card/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
        <div>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING_BOUNCY}
            className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">AI Web Builder</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            认证已升级为移动端优先体验：注册先验证邮箱再设置密码，日常登录可在验证码和密码之间切换，客户端默认记住你 7 天。
          </p>
          {rememberedUntilLabel ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              当前登录态最长记住到 {rememberedUntilLabel}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          {renderStepCard()}

          {!authConfigured ? (
            <section className="rounded-3xl border border-amber-200/60 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
              <div className="font-medium">邮箱认证尚未配置完成</div>
              <div className="mt-2">
                请先配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_SUPABASE_EMAIL_REDIRECT_TO`。
              </div>
              <div className="mt-2">
                密码重置回调可选配置：`VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO`。
              </div>
              <div className="mt-2">当前登录回调：`{authConfig.emailRedirectTo}`</div>
              <div className="mt-1">当前重置回调：`{authConfig.passwordResetRedirectTo}`</div>
            </section>
          ) : null}

          {currentError ? (
            <section className="rounded-3xl border border-rose-200/60 bg-rose-50/70 p-4 text-sm leading-6 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
              {currentError}
            </section>
          ) : null}

          <section className="rounded-3xl border border-border bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ArrowLeft className="h-3.5 w-3.5 text-primary" />
              当前策略
            </div>
            <ul className="mt-2 space-y-1">
              <li>注册流程：邮箱 → 验证码 → 设置密码</li>
              <li>登录流程：验证码登录 / 密码登录 二选一</li>
              <li>密码找回：邮箱重置链接 → 回到 App 设置新密码</li>
              <li>微信登录仍不在本次变更范围内</li>
            </ul>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
