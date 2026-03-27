import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronRight,
  Loader2,
  Mail,
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

type EntryMode = "login" | "register";
type OtpPurpose = "login" | "register" | null;

const PANEL = { duration: 0.24, ease: EASE_SMOOTH };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    rememberUntil,
  } = useAuthStore();

  const [entryMode, setEntryMode] = useState<EntryMode>("login");
  const [email, setEmail] = useState(pendingActionEmail ?? pendingEmail ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isClearingPendingAction, setIsClearingPendingAction] = useState(false);

  const hasLegacyResetRecovery = pendingAction === "reset_password";

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pendingEmail) setEmail(pendingEmail);
  }, [pendingEmail]);

  useEffect(() => {
    if (pendingActionEmail) setEmail(pendingActionEmail);
    if (pendingAction === "reset_password") {
      setEntryMode("login");
      setOtpPurpose(null);
      setVerificationCode("");
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
    if (hasLegacyResetRecovery) {
      return {
        label: "安全迁移",
        title: "通过资料页管理密码",
        desc: "旧的邮件回流重置已下线。请先完成 OTP 登录，再到个人信息页的安全区域设置或重置密码。",
      };
    }

    if (entryMode === "register") {
      return otpPurpose === "register"
        ? {
            label: "步骤 2 / 2",
            title: "输入注册验证码",
            desc: "验证通过后直接创建账号并进入应用。",
          }
        : {
            label: "步骤 1 / 2",
            title: "先验证你的邮箱",
            desc: "注册入口只保留邮箱验证码这一条路径。",
          };
    }

    return otpPurpose === "login"
      ? {
          label: "步骤 2 / 2",
          title: "输入登录验证码",
          desc: "当前登录入口只保留邮箱验证码。",
        }
      : {
          label: "步骤 1 / 2",
          title: "邮箱验证码登录",
          desc: "先发送验证码，再完成校验并进入应用。",
        };
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
    tone: "primary" | "success" | "sky" = "primary",
    testId?: string,
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
        data-testid={testId}
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
  ];

  const flowBody = () => {
    if (hasLegacyResetRecovery) {
      return (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-sky-200/60 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300">
            <span className="font-medium">{targetEmail}</span> 的旧密码回流链接已不再作为主流程使用。请返回 OTP 登录，进入资料页安全区域继续处理密码。
          </div>
          <button
            type="button"
            onClick={() => void handleClearPendingAction()}
            disabled={isClearingPendingAction}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {isClearingPendingAction ? "正在返回 OTP 登录" : "返回 OTP 登录"}
          </button>
        </div>
      );
    }

    if (entryMode === "register") {
      return (
        <div className="space-y-4">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="注册邮箱地址"
            autoComplete="email"
            className="h-12 rounded-2xl bg-background"
          />
          {otpPurpose === "register" ? (
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="输入注册验证码"
              inputMode="numeric"
              className="h-12 rounded-2xl bg-background"
            />
          ) : null}
          {otpPurpose === "register"
            ? primaryButton(
                () => void handleVerifyCode(),
                isVerifyLoading,
                "验证邮箱并创建账号",
                <ShieldCheck className="h-4 w-4" />,
                "success",
                "verify-register-otp",
              )
            : primaryButton(
                () => void handleRequestOtp("register"),
                isEmailLoading,
                "发送注册验证码",
                <Mail className="h-4 w-4" />,
                "success",
                "request-register-otp",
              )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            {otpPurpose === "register" ? (
              <button
                type="button"
                onClick={() => void handleRequestOtp("register")}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                重新发送验证码
              </button>
            ) : (
              <span>注册成功后会自动生成默认昵称与头像。</span>
            )}
            <button
              type="button"
              onClick={() => switchEntryMode("login")}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              已有账号，返回登录
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="输入邮箱地址"
          autoComplete="email"
          className="h-12 rounded-2xl bg-background"
        />
        {otpPurpose === "login" ? (
          <Input
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder="输入邮箱中的 6 位验证码"
            inputMode="numeric"
            className="h-12 rounded-2xl bg-background"
          />
        ) : null}
        {otpPurpose === "login"
          ? primaryButton(
              () => void handleVerifyCode(),
              isVerifyLoading,
              "验证并登录",
              <ShieldCheck className="h-4 w-4" />,
              "primary",
              "verify-login-otp",
            )
          : primaryButton(
              () => void handleRequestOtp("login"),
              isEmailLoading,
              "发送登录验证码",
              <Mail className="h-4 w-4" />,
              "primary",
              "request-login-otp",
            )}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          {otpPurpose === "login" ? (
            <button
              type="button"
              onClick={() => void handleRequestOtp("login")}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              重新发送验证码
            </button>
          ) : (
            <span>验证码会发送到你填写的邮箱。</span>
          )}
          <span>密码设置与重置已迁移到登录后的个人信息页。</span>
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
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{stepMeta.desc}</p>
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

        {!hasLegacyResetRecovery ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">选择入口</p>
              </div>
              <div className="rounded-full bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                {entryMode === "login" ? "登录中" : "注册中"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? "border-primary/25 bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
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
            <div className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">安全认证</div>
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${entryMode}-${pendingAction}-${otpPurpose}`}
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

        {!authConfigured ? (
          <section className="rounded-[24px] border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
            <div className="font-medium">邮箱认证尚未配置完成</div>
            <div className="mt-2">请先配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_SUPABASE_EMAIL_REDIRECT_TO`。</div>
            <div className="mt-1">密码重置回流可选配置：`VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO`。</div>
            <div className="mt-2 break-all text-xs">当前登录回调：{authConfig.emailRedirectTo}</div>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}
