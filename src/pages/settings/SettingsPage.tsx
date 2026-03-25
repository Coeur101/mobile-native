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
import {
  EASE_SMOOTH,
  SPRING_BOUNCY,
  STAGGER_DELAY,
  buttonTap,
} from "@/lib/animations";
import type { UserSettings } from "@/types";

const defaultForm: UserSettings = {
  theme: "auto",
  preferredModel: "mock-gpt",
  customBaseUrl: "",
  apiKey: "",
  notes: "当前为演示模式，设置仅保存在本地。",
};

const themeOptions = [
  { value: "light" as const, label: "浅色", icon: Sun },
  { value: "auto" as const, label: "自动", icon: Monitor },
  { value: "dark" as const, label: "深色", icon: Moon },
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
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_SMOOTH }}
        className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-primary/20 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Settings</p>
              <h1 className="text-lg font-semibold text-foreground">用户级设置</h1>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleLogout()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </motion.button>
        </div>
      </motion.header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 主题与模型 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY, duration: 0.4, ease: EASE_SMOOTH }}
            className="rounded-[28px] border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">主题与模型</h2>

            {/* 主题切换 — 三选一 */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-foreground">主题</label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = settings.theme === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => handleThemeChange(option.value)}
                      className={`relative flex h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${
                        isActive
                          ? "border-primary bg-accent"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="absolute inset-0 rounded-[10px] border-2 border-primary"
                          transition={SPRING_BOUNCY}
                        />
                      )}
                      <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        {option.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                模型偏好
                <Input
                  value={settings.preferredModel}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      preferredModel: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 rounded-2xl"
                />
              </label>
            </div>
          </motion.section>

          {/* 认证与云端 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY * 2, duration: 0.4, ease: EASE_SMOOTH }}
            className="rounded-[28px] border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">认证与云端接入位</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Base URL
                <Input
                  value={settings.customBaseUrl}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      customBaseUrl: event.target.value,
                    }))
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
                    setSettings((current) => ({
                      ...current,
                      apiKey: event.target.value,
                    }))
                  }
                  placeholder="仅预留，不做真实调用"
                  className="mt-2 h-11 rounded-2xl"
                />
              </label>
            </div>
          </motion.section>
        </div>

        {/* 提示信息 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER_DELAY * 3, duration: 0.4, ease: EASE_SMOOTH }}
          className="mt-4 rounded-[28px] border border-amber-200/50 bg-amber-50/50 p-5 text-sm leading-6 text-amber-900 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300"
        >
          当前所有设置都只保存在本地。邮箱登录、微信登录、Supabase 会话、聊天记录云端存储和 AI 服务代理都已预留字段与服务接口，后续可以直接替换 mock 实现。
        </motion.section>

        {/* 备注 + 保存 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER_DELAY * 4, duration: 0.4, ease: EASE_SMOOTH }}
          className="mt-4 rounded-[28px] border border-border bg-card p-5 shadow-sm"
        >
          <label className="block text-sm font-medium text-foreground">
            备注
            <textarea
              value={settings.notes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-3xl border border-border bg-input-background px-4 py-4 text-sm text-foreground outline-none transition focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </label>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleSave()}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {saveSuccess ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={SPRING_BOUNCY}
                >
                  <Check className="h-4 w-4" />
                </motion.div>
                已保存
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存设置
              </>
            )}
          </motion.button>
        </motion.section>
      </main>
    </PageTransition>
  );
}
