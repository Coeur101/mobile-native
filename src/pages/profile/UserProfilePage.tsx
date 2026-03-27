import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
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
import { PageTransition } from "@/components/ui/page-transition";
import { authService } from "@/services/auth";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { useAuthStore } from "@/stores/use-auth-store";
import { useThemeStore } from "@/stores/use-theme-store";
import type { UserSettings } from "@/types";

type ThemeOption = UserSettings["theme"];

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

export function UserProfilePage() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const [settingsTheme, setSettingsTheme] = useState<ThemeOption>("auto");

  useEffect(() => {
    setSettingsTheme(mockSettingsService.getSettings().theme);
  }, []);

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

  const displayName = profile?.nickname?.trim() || profile?.email || "Anonymous User";

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
              <p className="text-xs text-muted-foreground">Account summary and quick preferences</p>
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
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-card bg-secondary text-2xl font-semibold text-foreground shadow-sm">
                  {profile?.avatarBase64 ? (
                    <img
                      src={profile.avatarBase64}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : profile ? (
                    getDisplayInitials(displayName)
                  ) : (
                    <UserCircle2 className="h-10 w-10" />
                  )}
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
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Provider
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">Email OTP</p>
              </div>
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Password Status
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {profile?.hasPassword ? "Password set" : "OTP-only"}
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
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </motion.button>
              );
            })}
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
    </PageTransition>
  );
}
