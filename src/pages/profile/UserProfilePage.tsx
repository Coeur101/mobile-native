import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { authService } from "@/services/auth";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useThemeStore } from "@/stores/use-theme-store";
import type { UserSettings } from "@/types";

type ThemeOption = UserSettings["theme"];
type SecurityStep = "idle" | "code_sent";

const MAX_AVATAR_EDGE = 256;
const AVATAR_QUALITY = 0.82;

const themeOptions: Array<{
  value: ThemeOption;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "浅色",
    description: "界面更明亮，适合白天查看。",
    icon: Sun,
  },
  {
    value: "auto",
    label: "跟随系统",
    description: "自动使用当前设备的主题模式。",
    icon: Monitor,
  },
  {
    value: "dark",
    label: "深色",
    description: "降低夜间使用时的视觉刺激。",
    icon: Moon,
  },
];

function getDisplayInitials(name: string) {
  const source = name.trim();
  if (!source) {
    return "用户";
  }

  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "暂无" : date.toLocaleString("zh-CN", { hour12: false });
}

function validatePasswordPair(password: string, confirmPassword: string) {
  if (!password.trim()) {
    return "请输入新密码。";
  }

  if (password.trim().length < 8) {
    return "新密码至少需要 8 位。";
  }

  if (password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }

  return null;
}

async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("读取图片失败。"));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("解析图片失败。"));
      image.onload = () => {
        const scale = Math.min(1, MAX_AVATAR_EDGE / image.width, MAX_AVATAR_EDGE / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("当前环境不支持图片压缩。"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL("image/webp", AVATAR_QUALITY);

        if (webpDataUrl.startsWith("data:image/webp")) {
          resolve(webpDataUrl);
          return;
        }

        resolve(canvas.toDataURL("image/jpeg", AVATAR_QUALITY));
      };

      image.src = typeof reader.result === "string" ? reader.result : "";
    };

    reader.readAsDataURL(file);
  });
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profile = useAuthStore((state) => state.profile);
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const [settingsTheme, setSettingsTheme] = useState<ThemeOption>("auto");
  const [nicknameInput, setNicknameInput] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [securityStep, setSecurityStep] = useState<SecurityStep>("idle");
  const [securityCode, setSecurityCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSecuritySending, setIsSecuritySending] = useState(false);
  const [isSecuritySubmitting, setIsSecuritySubmitting] = useState(false);

  useEffect(() => {
    setSettingsTheme(mockSettingsService.getSettings().theme);
  }, []);

  useEffect(() => {
    setNicknameInput(profile?.nickname ?? "");
  }, [profile?.nickname]);

  const displayName = profile?.nickname?.trim() || profile?.email || "未设置用户名";
  const currentNickname = profile?.nickname?.trim() ?? "";
  const trimmedNickname = nicknameInput.trim();
  const hasNicknameChanged = trimmedNickname !== currentNickname;
  const canSaveNickname = Boolean(trimmedNickname) && hasNicknameChanged && !isProfileSaving;
  const passwordActionLabel = profile?.hasPassword ? "重置密码" : "设置密码";
  const passwordStatusLabel = profile?.hasPassword ? "已设置" : "仅验证码";

  const resetSecurityForm = () => {
    setSecurityStep("idle");
    setSecurityCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleThemeChange = async (theme: ThemeOption) => {
    setSettingsTheme(theme);
    setThemeMode(theme);
    await mockSettingsService.saveSettings({
      ...mockSettingsService.getSettings(),
      theme,
    });

    const selectedTheme = themeOptions.find((option) => option.value === theme)?.label ?? theme;
    toast.success(`已切换为${selectedTheme}主题。`);
  };

  const handleSaveNickname = async () => {
    if (!trimmedNickname) {
      toast.error("用户名不能为空。");
      return;
    }

    if (!hasNicknameChanged) {
      return;
    }

    setIsProfileSaving(true);
    try {
      await authService.updateProfile({ nickname: trimmedNickname });
      toast.success("用户名已更新。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "用户名更新失败，请稍后重试。";
      toast.error(message);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    toast.success("已退出登录。");
    navigate("/login", { replace: true });
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsAvatarUploading(true);
    try {
      const compressedAvatar = await compressImageFile(file);
      await authService.updateProfile({ avatarBase64: compressedAvatar });
      toast.success("头像已更新。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "头像更新失败，请稍后重试。";
      toast.error(message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRequestSecurityCode = async () => {
    setIsSecuritySending(true);
    try {
      const result = await authService.requestPasswordReauthentication();
      setSecurityStep("code_sent");
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送验证码失败，请稍后重试。";
      toast.error(message);
    } finally {
      setIsSecuritySending(false);
    }
  };

  const handleSubmitPasswordAction = async () => {
    const validationError = validatePasswordPair(newPassword, confirmPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSecuritySubmitting(true);
    try {
      await authService.updatePasswordWithNonce(newPassword, securityCode);
      toast.success(profile?.hasPassword ? "密码已重置。" : "密码已设置。");
      setIsSecurityDialogOpen(false);
      resetSecurityForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "密码更新失败，请稍后重试。";
      toast.error(message);
    } finally {
      setIsSecuritySubmitting(false);
    }
  };

  return (
    <PageTransition className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-[var(--shadow-panel)]"
              title="返回首页"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <div className="text-[11px] tracking-[0.24em] text-muted-foreground">账户中心</div>
              <h1 className="mt-1 text-[1.1rem] font-semibold text-foreground">个人资料</h1>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleLogout()}
            className="flex h-11 items-center gap-2 rounded-full border border-destructive/18 bg-destructive/6 px-4 text-sm font-medium text-destructive"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出登录</span>
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <input
          ref={fileInputRef}
          data-testid="avatar-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleAvatarFileChange(event)}
        />

        <section
          data-testid="profile-page"
          className="overflow-hidden rounded-[36px] border border-border bg-card/92 shadow-[var(--shadow-card)]"
        >
          <div className="h-32 bg-[linear-gradient(135deg,rgba(0,113,227,0.16),rgba(255,255,255,0.02),rgba(52,170,220,0.18))]" />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border-4 border-card bg-secondary text-2xl font-semibold text-foreground shadow-[var(--shadow-panel)]">
                  {profile?.avatarBase64 ? (
                    <img
                      data-testid="profile-avatar-image"
                      src={profile.avatarBase64}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : profile ? (
                    <span data-testid="profile-avatar-fallback">{getDisplayInitials(displayName)}</span>
                  ) : (
                    <UserCircle2 className="h-10 w-10" />
                  )}
                  <motion.button
                    type="button"
                    data-testid="avatar-upload-trigger"
                    whileTap={buttonTap}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-[var(--shadow-panel)] disabled:opacity-65"
                    title="上传头像"
                  >
                    {isAvatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </motion.button>
                </div>

                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-foreground">
                    {displayName}
                  </h2>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary/75 px-3 py-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email ?? "暂无邮箱"}</span>
                  </div>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={() => navigate("/settings")}
                data-testid="advanced-settings-link"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75"
              >
                高级设置
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <section className="rounded-[28px] bg-secondary/58 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">基础信息</h3>
                  </div>
                  <div className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">
                    最近更新：{formatDateLabel(profile?.updatedAt ?? null)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="block text-sm font-medium text-foreground">
                    用户名
                    <Input
                      data-testid="profile-nickname-input"
                      value={nicknameInput}
                      onChange={(event) => setNicknameInput(event.target.value)}
                      placeholder="请输入用户名"
                      maxLength={24}
                      className="mt-2 h-12"
                    />
                  </label>
                  <motion.button
                    type="button"
                    data-testid="save-profile-nickname"
                    whileTap={buttonTap}
                    onClick={() => void handleSaveNickname()}
                    disabled={!canSaveNickname}
                    className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)] disabled:opacity-60"
                  >
                    {isProfileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存用户名
                  </motion.button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-card/90 px-4 py-4">
                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground">邮箱地址</p>
                    <p className="mt-3 break-all text-base font-semibold text-foreground">
                      {profile?.email ?? "暂无邮箱"}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-card/90 px-4 py-4">
                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground">邮箱状态</p>
                    <p className="mt-3 text-base font-semibold text-foreground">
                      {profile?.emailVerified ? "已验证" : "未验证"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] bg-secondary/58 p-4">
                <h3 className="text-lg font-semibold text-foreground">账户状态</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "登录方式", value: "邮箱验证" },
                    { label: "密码状态", value: passwordStatusLabel, testId: "password-status" },
                    { label: "最近登录", value: formatDateLabel(profile?.lastSignInAt ?? null) },
                    { label: "资料更新时间", value: formatDateLabel(profile?.updatedAt ?? null) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] bg-card/90 px-4 py-4">
                      <p className="text-[11px] tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p
                        data-testid={item.testId}
                        className="mt-3 text-base font-semibold text-foreground"
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] border border-border bg-card/92 p-5 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[1.25rem] font-semibold text-foreground">界面主题</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = (settingsTheme || themeMode) === option.value;

                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileTap={buttonTap}
                    onClick={() => void handleThemeChange(option.value)}
                    className={`relative flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "border-primary/18 bg-accent/65"
                        : "border-border bg-card hover:bg-secondary/65"
                    }`}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="profile-theme-indicator"
                        className="pointer-events-none absolute inset-0 rounded-[24px] border border-primary/18"
                        transition={SPRING_BOUNCY}
                      />
                    ) : null}
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{option.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[32px] border border-border bg-card/92 p-5 shadow-[var(--shadow-panel)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[1.25rem] font-semibold text-foreground">账户安全</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    {profile?.emailVerified ? "邮箱已验证" : "邮箱未验证"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                    {profile?.hasPassword ? "已设置登录密码" : "当前仅支持验证码登录"}
                  </span>
                </div>
              </div>

              <motion.button
                type="button"
                data-testid="start-password-security-action"
                whileTap={buttonTap}
                onClick={() => {
                  resetSecurityForm();
                  setIsSecurityDialogOpen(true);
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)]"
              >
                <KeyRound className="h-4 w-4" />
                {passwordActionLabel}
              </motion.button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-secondary/72 px-4 py-4">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground">验证邮箱</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {profile?.email ?? "暂无邮箱"}
                </p>
              </div>
              <div className="rounded-[24px] bg-secondary/72 px-4 py-4">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground">最近登录</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {formatDateLabel(profile?.lastSignInAt ?? null)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Dialog
        open={isSecurityDialogOpen}
        onClose={() => {
          setIsSecurityDialogOpen(false);
          resetSecurityForm();
        }}
        title={passwordActionLabel}
      >
        <div data-testid="password-security-dialog" className="space-y-4">
          <div className="rounded-[20px] bg-secondary/72 px-4 py-3 text-sm leading-6 text-muted-foreground">
            验证码会发送到
            <span className="mx-1 font-medium text-foreground">{profile?.email ?? "当前邮箱"}</span>
            ，请先完成验证。
          </div>

          {securityStep === "idle" ? (
            <motion.button
              type="button"
              data-testid="send-security-code"
              whileTap={buttonTap}
              onClick={() => void handleRequestSecurityCode()}
              disabled={isSecuritySending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-65"
            >
              {isSecuritySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              发送验证码
            </motion.button>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                验证码
                <Input
                  data-testid="security-code-input"
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value)}
                  placeholder="请输入验证码"
                  inputMode="numeric"
                  className="mt-2 h-12"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                新密码
                <Input
                  data-testid="security-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="请输入新密码"
                  autoComplete="new-password"
                  className="mt-2 h-12"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                确认密码
                <Input
                  data-testid="security-password-confirm-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="请再次输入新密码"
                  autoComplete="new-password"
                  className="mt-2 h-12"
                />
              </label>
              <motion.button
                type="button"
                data-testid="confirm-password-security-action"
                whileTap={buttonTap}
                onClick={() => void handleSubmitPasswordAction()}
                disabled={isSecuritySubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-65"
              >
                {isSecuritySubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {passwordActionLabel}
              </motion.button>
              <button
                type="button"
                onClick={() => void handleRequestSecurityCode()}
                className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                重新发送验证码
              </button>
            </div>
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}
