import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  KeyRound,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { EASE_SMOOTH, SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { authConfig } from "@/services/auth/auth-config";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/use-auth-store";

type EntryMode = "login" | "register" | "reset_request";
type LoginMethod = "otp" | "password";
type OtpPurpose = "login" | "register" | null;

const PANEL = { duration: 0.24, ease: EASE_SMOOTH };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordPair(password: string, confirm?: string) {
  if (password.trim().length < 8) return "密码至少需要 8 位字符。";
  if (confirm !== undefined && password !== confirm) return "两次输入的密码不一致。";
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

  const [entryMode, setEntryMode] = useState<EntryMode>(
    pendingAction === "complete_registration"
      ? "register"
      : pendingAction === "reset_password"
        ? "reset_request"
        : "login",
  );
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    lastAuthMethod === "password" ? "password" : "otp",
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

  const isRegistrationPasswordStep = pendingAction === "complete_registration";
  const isResetPasswordStep = pendingAction === "reset_password";

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pendingEmail) setEmail(pendingEmail);
  }, [pendingEmail]);

  useEffect(() => {
    if (pendingActionEmail) setEmail(pendingActionEmail);
    if (pendingAction === "complete_registration") {
      setEntryMode("register");
      setOtpPurpose(null);
    }
    if (pendingAction === "reset_password") {
      setEntryMode("reset_request");
      setOtpPurpose(null);
    }
  }, [pendingAction, pendingActionEmail]);

  const currentError = submitError ?? lastError;
  const targetEmail = useMemo(
    () => (pendingActionEmail ?? pendingEmail ?? email).trim().toLowerCase(),
    [email, pendingActionEmail, pendingEmail],
  );
  const rememberedUntilLabel = rememberUntil
    ? new Date(rememberUntil).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const stepMeta = (() => {
    if (isRegistrationPasswordStep) {
      return { label: "步骤 3 / 3", title: "设置登录密码", desc: "邮箱已经验证成功，现在只剩最后一步。", steps: ["填写邮箱", "验证邮箱", "设置密码"], active: 3 };
    }
    if (isResetPasswordStep) {
      return { label: "步骤 2 / 2", title: "设置新密码", desc: "邮件回流已经到位，现在完成设密即可。", steps: ["发送重置邮件", "设置新密码"], active: 2 };
    }
    if (entryMode === "register") {
      return { label: otpPurpose === "register" ? "步骤 2 / 3" : "步骤 1 / 3", title: otpPurpose === "register" ? "输入注册验证码" : "先验证你的邮箱", desc: otpPurpose === "register" ? "验证通过后才进入设密步骤。" : "移动端先做邮箱验证，再进入设密。", steps: ["填写邮箱", "验证邮箱", "设置密码"], active: otpPurpose === "register" ? 2 : 1 };
    }
    if (entryMode === "reset_request") {
      return { label: "步骤 1 / 2", title: "发送密码重置邮件", desc: "我们会发送一封带回流链接的邮件。", steps: ["发送重置邮件", "设置新密码"], active: 1 };
    }
    if (loginMethod === "password") {
      return { label: "密码登录", title: "用熟悉的密码快速返回", desc: "切换登录方式只负责导航，不再和提交动作混排。", steps: ["选择方式", "输入密码", "进入应用"], active: 2 };
    }
    return { label: otpPurpose === "login" ? "步骤 2 / 2" : "步骤 1 / 2", title: otpPurpose === "login" ? "输入登录验证码" : "用邮箱验证码快速登录", desc: otpPurpose === "login" ? "当前只保留这一件事：验证并进入应用。" : "先发送验证码，再完成校验。", steps: ["发送验证码", "验证登录"], active: otpPurpose === "login" ? 2 : 1 };
  })();

  const ensureValidEmail = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!isValidEmail(normalized)) throw new Error("请输入有效的邮箱地址。");
    return normalized;
  };

  const switchEntryMode = (next: EntryMode) => {
    setEntryMode(next);
    setSubmitError(null);
    setOtpPurpose(null);
    setVerificationCode("");
    setPassword("");
  };

  const switchLoginMethod = (next: LoginMethod) => {
    setLoginMethod(next);
    setSubmitError(null);
    setOtpPurpose(null);
    setVerificationCode("");
    setPassword("");
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
      const result = await authService.verifyEmailOtp(ensureValidEmail(targetEmail), verificationCode, otpPurpose);
      if (result.status === "password_setup_required") {
        toast.success(result.message);
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.success(result.message);
        navigate("/", { replace: true });
      }
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
      const error = validatePasswordPair(password);
      if (error) throw new Error(error);
      await authService.signInWithPassword(ensureValidEmail(email), password);
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
      const error = validatePasswordPair(password, confirmPassword);
      if (error) throw new Error(error);
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
      const result = await authService.requestPasswordReset(ensureValidEmail(email));
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
      const error = validatePasswordPair(password, confirmPassword);
      if (error) throw new Error(error);
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
      setEntryMode("login");
      setLoginMethod("otp");
      setOtpPurpose(null);
      setVerificationCode("");
      setPassword("");
      setConfirmPassword("");
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
    icon: React.ReactNode,
    tone: "primary" | "success" | "sky" = "primary",
  ) => {
    const toneClass =
      tone === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-500"
        : tone === "sky"
          ? "bg-sky-600 text-white hover:bg-sky-500"
          : "bg-primary text-primary-foreground hover:opacity-90";
    return (
      <motion.button
        type="button"
        data-testid="primary-auth-action"
        whileTap={buttonTap}
        onClick={onClick}
        disabled={loading || isLoading}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-70 ${toneClass}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {label}
      </motion.button>
    );
  };

  const entryCards = [
    {
      value: "login" as const,
      eyebrow: "常用",
      title: "登录",
    },
    {
      value: "register" as const,
      eyebrow: "新账号",
      title: "注册",
    },
    {
      value: "reset_request" as const,
      eyebrow: "恢复",
      title: "重置密码",
    },
  ];

  const flowBody = () => {
    if (isRegistrationPasswordStep) {
      return (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-sm leading-6 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
            邮箱 <span className="font-medium">{targetEmail}</span> 已经验证成功，现在只剩设置密码这一件事。
          </div>
          <div className="space-y-3">
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="昵称（可选）" className="h-12 rounded-2xl bg-background" />
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="设置 8 位以上密码" autoComplete="new-password" className="h-12 rounded-2xl bg-background" />
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" autoComplete="new-password" className="h-12 rounded-2xl bg-background" />
          </div>
          {primaryButton(() => void handleCompleteRegistration(), isPasswordLoading, "完成注册并进入应用", <ArrowRight className="h-4 w-4" />, "success")}
          <button type="button" onClick={() => void handleClearPendingAction()} disabled={isClearingPendingAction} className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            放弃本次注册，返回登录
          </button>
        </div>
      );
    }

    if (isResetPasswordStep) {
      return (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-sky-200/60 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300">
            正在为 <span className="font-medium">{targetEmail}</span> 设置新密码。完成后会直接恢复登录状态。
          </div>
          <div className="space-y-3">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入新密码" autoComplete="new-password" className="h-12 rounded-2xl bg-background" />
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入新密码" autoComplete="new-password" className="h-12 rounded-2xl bg-background" />
          </div>
          {primaryButton(() => void handleCompletePasswordReset(), isPasswordLoading, "保存新密码", <ShieldCheck className="h-4 w-4" />, "sky")}
        </div>
      );
    }

    if (entryMode === "login") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">选择登录方式</div>
            <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-background/80 p-1.5">
              <button type="button" data-testid="login-method-otp" onClick={() => switchLoginMethod("otp")} className={`rounded-[18px] px-3 py-3 text-sm font-medium transition-all ${loginMethod === "otp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>验证码登录</button>
              <button type="button" data-testid="login-method-password" onClick={() => switchLoginMethod("password")} className={`rounded-[18px] px-3 py-3 text-sm font-medium transition-all ${loginMethod === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>密码登录</button>
            </div>
          </div>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="输入邮箱地址" autoComplete="email" className="h-12 rounded-2xl bg-background" />
          <AnimatePresence mode="wait">
            {loginMethod === "password" ? (
              <motion.div key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={PANEL} className="space-y-3">
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入登录密码" autoComplete="current-password" className="h-12 rounded-2xl bg-background" />
                {primaryButton(() => void handlePasswordLogin(), isPasswordLoading, "使用密码登录", <KeyRound className="h-4 w-4" />)}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <button type="button" onClick={() => switchEntryMode("reset_request")} className="underline-offset-2 hover:text-foreground hover:underline">忘记密码</button>
                  <span>也可以切回验证码方式</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={PANEL} className="space-y-3">
                {otpPurpose === "login" ? <Input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="输入邮箱中的 6 位验证码" inputMode="numeric" className="h-12 rounded-2xl bg-background" /> : null}
                {otpPurpose === "login" ? primaryButton(() => void handleVerifyCode(), isVerifyLoading, "验证并登录", <ShieldCheck className="h-4 w-4" />) : primaryButton(() => void handleRequestOtp("login"), isEmailLoading, "发送登录验证码", <Mail className="h-4 w-4" />)}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  {otpPurpose === "login" ? <button type="button" onClick={() => void handleRequestOtp("login")} className="underline-offset-2 hover:text-foreground hover:underline">重新发送验证码</button> : <span>验证码会发送到你填写的邮箱。</span>}
                  <span>若未收到邮件，请检查垃圾箱或稍后重试。</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (entryMode === "register") {
      return (
        <div className="space-y-4">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="注册邮箱地址" autoComplete="email" className="h-12 rounded-2xl bg-background" />
          {otpPurpose === "register" ? <Input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="输入注册验证码" inputMode="numeric" className="h-12 rounded-2xl bg-background" /> : null}
          {otpPurpose === "register" ? primaryButton(() => void handleVerifyCode(), isVerifyLoading, "验证邮箱，进入设密步骤", <ShieldCheck className="h-4 w-4" />) : primaryButton(() => void handleRequestOtp("register"), isEmailLoading, "发送注册验证码", <Mail className="h-4 w-4" />)}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>验证通过后再设置密码，注册流程会自动继续。</span>
            <button type="button" onClick={() => switchEntryMode("login")} className="underline-offset-2 hover:text-foreground hover:underline">已有账号，返回登录</button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="输入需要重置密码的邮箱" autoComplete="email" className="h-12 rounded-2xl bg-background" />
        {primaryButton(() => void handleRequestPasswordReset(), isResetLoading, "发送重置邮件", <RotateCcw className="h-4 w-4" />)}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>收到邮件后点击链接，会自动回到当前登录页继续设密。</span>
          <button type="button" onClick={() => switchEntryMode("login")} className="underline-offset-2 hover:text-foreground hover:underline">返回登录</button>
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="min-h-screen px-4 py-6 sm:px-6" style={{ background: "var(--gradient-warm-bg)" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-44 w-44 rounded-full bg-[#F59E0B]/10 blur-[90px]" />
        <div className="absolute -right-[12%] top-[2%] h-64 w-64 rounded-full bg-[#8B5CF6]/10 blur-[110px] dark:bg-[#A78BFA]/8" />
        <div className="absolute bottom-[-10%] left-[-8%] h-60 w-60 rounded-full bg-[#EC4899]/8 blur-[110px] dark:bg-[#F472B6]/6" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col gap-3">
        <section className="overflow-hidden rounded-[28px] border border-border bg-card/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-accent-foreground">
                邮箱认证
              </div>
              <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">{stepMeta.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-background/80 px-2.5 py-1">{stepMeta.label}</span>
                {rememberedUntilLabel ? <span>登录状态保持至 {rememberedUntilLabel}</span> : null}
              </div>
            </div>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING_BOUNCY, delay: 0.05 }}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] text-primary-foreground shadow-lg"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          </div>
        </section>

        {!isRegistrationPasswordStep && !isResetPasswordStep ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">选择入口</p>
              </div>
              <div className="rounded-full bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">{entryMode === "login" ? "登录中" : entryMode === "register" ? "注册中" : "重置中"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {entryCards.map((item) => {
                const active = entryMode === item.value;
                return (
                  <motion.button
                    key={item.value}
                    type="button"
                    data-testid={`entry-mode-${item.value}`}
                    whileTap={buttonTap}
                    onClick={() => switchEntryMode(item.value)}
                    className={[
                      "group rounded-[20px] border px-3 py-3 text-left transition-all duration-200",
                      active
                        ? "border-primary/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(243,238,255,0.92))] shadow-[0_12px_24px_rgba(139,92,246,0.12)] dark:border-primary/20 dark:bg-[linear-gradient(135deg,rgba(28,25,23,0.96),rgba(30,21,51,0.92))]"
                        : "border-border bg-card/70 hover:border-primary/20 hover:bg-card",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{item.eyebrow}</p>
                        <h2 className="mt-1 text-sm font-semibold text-foreground">{item.title}</h2>
                      </div>
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${active ? "border-primary/25 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground group-hover:text-foreground"}`}>
                        {active ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-border bg-card/90 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">当前操作</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{stepMeta.title}</div>
            </div>
            <div className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">安全验证</div>
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${entryMode}-${loginMethod}-${pendingAction}-${otpPurpose}`}
                initial={{ opacity: 0, y: 14 }}
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
                    className="rounded-[22px] border border-rose-200/60 bg-rose-50/80 px-4 py-3 text-sm leading-6 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300"
                  >
                    {currentError}
                  </motion.div>
                ) : null}
                {flowBody()}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <div className="space-y-3">
          {!authConfigured ? (
            <section className="rounded-[24px] border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
              <div className="font-medium">邮箱认证尚未配置完成</div>
              <div className="mt-2">请先配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_SUPABASE_EMAIL_REDIRECT_TO`。</div>
              <div className="mt-1">密码重置回流可选配置：`VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO`。</div>
              <div className="mt-2 break-all text-xs">当前登录回调：{authConfig.emailRedirectTo}</div>
            </section>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
