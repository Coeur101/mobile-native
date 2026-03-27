import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  ShieldCheck,
  Sun,
  UserCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { authService } from "@/services/auth";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
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
    label: "Light",
    description: "Always use the light surface palette.",
    icon: Sun,
  },
  {
    value: "auto",
    label: "Auto",
    description: "Follow the current system preference.",
    icon: Monitor,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark surface palette.",
    icon: Moon,
  },
];

function getDisplayInitials(name: string) {
  const source = name.trim();
  if (!source) {
    return "U";
  }

  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-US");
}

function validatePasswordPair(password: string, confirmPassword: string) {
  if (!password.trim()) {
    return "New password is required.";
  }

  if (password.trim().length < 8) {
    return "New password must be at least 8 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read the image file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Failed to decode the image."));
      image.onload = () => {
        const scale = Math.min(1, MAX_AVATAR_EDGE / image.width, MAX_AVATAR_EDGE / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas rendering is not available."));
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

  const displayName = profile?.nickname?.trim() || profile?.email || "Anonymous User";
  const passwordActionLabel = profile?.hasPassword ? "Reset password" : "Set password";
  const passwordActionDescription = profile?.hasPassword
    ? "Require an email verification code before rotating the password."
    : "Add a password to complement the OTP-first sign-in flow.";
  const passwordStatusLabel = profile?.hasPassword ? "Password set" : "OTP-only";

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
    toast.success(`Theme switched to ${theme}.`);
  };

  const handleLogout = async () => {
    await authService.signOut();
    toast.success("Signed out.");
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
      toast.success("Profile avatar updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update the avatar.";
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
      const message =
        error instanceof Error ? error.message : "Failed to send the verification code.";
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
      toast.success(profile?.hasPassword ? "Password reset completed." : "Password set.");
      setIsSecurityDialogOpen(false);
      resetSecurityForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update the password.";
      toast.error(message);
    } finally {
      setIsSecuritySubmitting(false);
    }
  };

  const securitySummary = useMemo(() => {
    return profile?.hasPassword
      ? "Password-based recovery is available after email verification."
      : "You currently sign in with email OTP only.";
  }, [profile?.hasPassword]);

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              title="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Profile</h1>
              <p className="text-xs text-muted-foreground">Account summary and secure controls</p>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleLogout()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/5"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
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
          className="overflow-hidden rounded-[32px] border border-border bg-card"
        >
          <div
            className="h-28"
            style={{
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(236,72,153,0.18) 45%, rgba(14,165,233,0.18))",
            }}
          />
          <div className="px-5 pb-5">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-card bg-secondary text-2xl font-semibold text-foreground shadow-sm">
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
                    className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
                    title="Upload avatar"
                  >
                    {isAvatarUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>
                <div className="pb-2">
                  <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email ?? "No email available"}</span>
                  </div>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={() => navigate("/settings")}
                data-testid="advanced-settings-link"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span>Advanced settings</span>
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
                <p className="mt-2 text-base font-semibold text-foreground">Email OTP</p>
              </div>
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Password Status
                </p>
                <p data-testid="password-status" className="mt-2 text-base font-semibold text-foreground">
                  {passwordStatusLabel}
                </p>
              </div>
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Last Sign-in
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {formatDateLabel(profile?.lastSignInAt ?? null)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Quick Preferences</h2>
              <p className="text-sm text-muted-foreground">
                Theme switching is available here. The full device-level configuration remains in
                advanced settings.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = (settingsTheme || themeMode) === option.value;

              return (
                <motion.button
                  key={option.value}
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => void handleThemeChange(option.value)}
                  className={`relative rounded-[24px] border p-4 text-left transition-all ${
                    isActive
                      ? "border-primary bg-accent shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-secondary"
                  }`}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="profile-theme-indicator"
                      className="pointer-events-none absolute inset-0 rounded-[24px] border border-primary"
                      transition={SPRING_BOUNCY}
                    />
                  ) : null}
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mt-4 text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Security</h2>
              <p className="mt-1 text-sm text-muted-foreground">{securitySummary}</p>
            </div>
            <motion.button
              type="button"
              data-testid="start-password-security-action"
              whileTap={buttonTap}
              onClick={() => {
                resetSecurityForm();
                setIsSecurityDialogOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              <KeyRound className="h-4 w-4" />
              <span>{passwordActionLabel}</span>
            </motion.button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Action</p>
              <p className="mt-2 text-base font-semibold text-foreground">{passwordActionLabel}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{passwordActionDescription}</p>
            </div>
            <div className="rounded-3xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Delivery</p>
              <p className="mt-2 text-base font-semibold text-foreground">Email verification code</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A fresh email code is required before the new password is accepted.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Profile Metadata</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Verified Email
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {profile?.emailVerified ? "Verified" : "Unverified"}
              </p>
            </div>
            <div className="rounded-3xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Profile Updated
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {formatDateLabel(profile?.updatedAt ?? null)}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={isSecurityDialogOpen}
        onClose={() => {
          setIsSecurityDialogOpen(false);
          resetSecurityForm();
        }}
        title={passwordActionLabel}
        description="Keep password management inside the profile screen and verify the action with a fresh email code."
      >
        <div data-testid="password-security-dialog" className="space-y-4">
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm leading-6 text-muted-foreground">
            This action will send a verification code to <span className="font-medium text-foreground">{profile?.email ?? "your email"}</span>.
          </div>

          {securityStep === "idle" ? (
            <motion.button
              type="button"
              data-testid="send-security-code"
              whileTap={buttonTap}
              onClick={() => void handleRequestSecurityCode()}
              disabled={isSecuritySending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSecuritySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>Send verification code</span>
            </motion.button>
          ) : (
            <div className="space-y-3">
              <Input
                data-testid="security-code-input"
                value={securityCode}
                onChange={(event) => setSecurityCode(event.target.value)}
                placeholder="Enter the verification code"
                inputMode="numeric"
                className="h-11 rounded-2xl"
              />
              <Input
                data-testid="security-password-input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter the new password"
                autoComplete="new-password"
                className="h-11 rounded-2xl"
              />
              <Input
                data-testid="security-password-confirm-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm the new password"
                autoComplete="new-password"
                className="h-11 rounded-2xl"
              />
              <motion.button
                type="button"
                data-testid="confirm-password-security-action"
                whileTap={buttonTap}
                onClick={() => void handleSubmitPasswordAction()}
                disabled={isSecuritySubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {isSecuritySubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>{passwordActionLabel}</span>
              </motion.button>
              <button
                type="button"
                onClick={() => void handleRequestSecurityCode()}
                className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Resend verification code
              </button>
            </div>
          )}
        </div>
      </Dialog>
    </PageTransition>
  );
}