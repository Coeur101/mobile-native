import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, LogOut, Moon, Monitor, Save, Sun } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { mockAuthService } from "@/services/auth/mock-auth-service";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import { useThemeStore } from "@/stores/use-theme-store";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import type { UserSettings } from "@/types";

const defaultForm: UserSettings = {
  theme: "auto",
  preferredModel: "mock-gpt",
  customBaseUrl: "",
  apiKey: "",
  notes: "当前为演示模式，设置仅保存在本地。",
};

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "浅色" },
  { value: "auto" as const, icon: Monitor, label: "自动" },
  { value: "dark" as const, icon: Moon, label: "深色" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultForm);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const setThemeMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    setSettings(mockSettingsService.getSettings());
  }, []);

  const handleSave = async () => {
    await mockSettingsService.saveSettings(settings);
    setSaveSuccess(true);
    toast.success("设置已保存到本地。");
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleThemeChange = (theme: UserSettings["theme"]) => {
    setSettings((current) => ({ ...current, theme }));
    setThemeMode(theme);
  };

  const handleLogout = async () => {
    await mockAuthService.signOut();
    toast.success("已退出演示模式。");
    navigate("/login", { replace: true });
  };

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Header — 纯图标 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              title="返回"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h1 className="text-lg font-semibold text-foreground">设置</h1>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleLogout()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/5"
            title="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 主题与模型 */}
          <section className="rounded-[28px] border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">主题</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = settings.theme === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileTap={buttonTap}
                    onClick={() => handleThemeChange(option.value)}
                    className={`relative flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                    title={option.value}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="theme-indicator"
                        className="absolute inset-0 rounded-[10px] border-2 border-primary"
                        transition={SPRING_BOUNCY}
                      />
                    )}
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{option.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                模型偏好
                <Input
                  value={settings.preferredModel}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, preferredModel: event.target.value }))
                  }
                  className="mt-2 h-11 rounded-2xl"
                />
              </label>
            </div>
          </section>

          {/* 认证与云端 */}
          <section className="rounded-[28px] border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">认证与云端</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Base URL
                <Input
                  value={settings.customBaseUrl}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, customBaseUrl: event.target.value }))
                  }
                  placeholder="https://example.supabase.co"
                  className="mt-2 h-11 rounded-2xl"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                API Key
                <Input
                  type="password"
                  value={settings.apiKey}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, apiKey: event.target.value }))
                  }
                  placeholder="仅预留，不做真实调用"
                  className="mt-2 h-11 rounded-2xl"
                />
              </label>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-[28px] border border-amber-200/50 bg-amber-50/50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
          当前所有设置都只保存在本地。后续可以直接替换 mock 实现。
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">
            备注
            <textarea
              value={settings.notes}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notes: event.target.value }))
              }
              className="mt-2 min-h-28 w-full rounded-3xl border border-border bg-input-background px-4 py-4 text-sm text-foreground outline-none transition focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </label>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleSave()}
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            title="保存设置"
          >
            {saveSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRING_BOUNCY}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>已保存</span>
              </motion.div>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>保存设置</span>
              </span>
            )}
          </motion.button>
        </section>
      </main>
    </PageTransition>
  );
}
