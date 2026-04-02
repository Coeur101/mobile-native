import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, LogOut, Save, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { buttonTap } from "@/lib/animations";
import { authService } from "@/services/auth";
import { settingsService } from "@/services/settings";
import type { UserSettings } from "@/types";

const defaultForm: UserSettings = {
  theme: "auto",
  preferredModel: "",
  customBaseUrl: "",
  apiKey: "",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultForm);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSettings(settingsService.getSettings());
  }, []);

  // 安全清理 saveSuccess 定时器
  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const handleSave = async () => {
    try {
      await settingsService.saveSettings(settings);
      setSaveSuccess(true);
      toast.success("高级设置已保存。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存设置失败，请稍后重试。";
      toast.error(message);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success("已退出登录。");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "退出登录失败。");
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
              onClick={() => navigate("/profile")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-[var(--shadow-panel)]"
              title="返回个人资料"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                工作区设置
              </div>
              <h1 className="mt-1 text-[1.1rem] font-semibold text-foreground">高级设置</h1>
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
            <span className="hidden sm:inline">退出</span>
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <section className="rounded-[32px] border border-border bg-card/92 p-5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[1.25rem] font-semibold text-foreground">AI 集成配置</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              模型名称
              <Input
                value={settings.preferredModel}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, preferredModel: event.target.value }))
                }
                placeholder="填写你常用的模型名称"
                className="mt-2 h-12"
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              Base URL
              <Input
                value={settings.customBaseUrl}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, customBaseUrl: event.target.value }))
                }
                placeholder="https://api.openai.com/v1"
                className="mt-2 h-12"
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
                placeholder="仅保存在当前设备"
                className="mt-2 h-12"
              />
            </label>
          </div>

          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleSave()}
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)]"
            title="保存高级设置"
          >
            {saveSuccess ? (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>已保存</span>
              </motion.div>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>保存设置</span>
              </>
            )}
          </motion.button>
        </section>
      </main>
    </PageTransition>
  );
}

