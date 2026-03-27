import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, LogOut, Save, Shield, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { authService } from "@/services/auth";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import { buttonTap } from "@/lib/animations";
import type { UserSettings } from "@/types";

const defaultForm: UserSettings = {
  theme: "auto",
  preferredModel: "",
  customBaseUrl: "",
  apiKey: "",
  notes: "",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultForm);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSettings(mockSettingsService.getSettings());
  }, []);

  const handleSave = async () => {
    await mockSettingsService.saveSettings(settings);
    setSaveSuccess(true);
    toast.success("高级设置已保存。");
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLogout = async () => {
    await authService.signOut();
    toast.success("已退出登录。");
    navigate("/login", { replace: true });
  };

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/profile")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              title="返回个人资料"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">高级设置</h1>
              <p className="text-xs text-muted-foreground">
                主题、密码安全和账号摘要已迁移到个人资料页，这里保留 AI 与设备级配置。
              </p>
            </div>
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
        <section className="rounded-[28px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI 集成配置</h2>
              <p className="text-sm text-muted-foreground">
                这些值仅保存在当前设备，用于连接你的 AI 服务并驱动项目生成。
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              模型名称
              <Input
                value={settings.preferredModel}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, preferredModel: event.target.value }))
                }
                placeholder="填写你的模型名称"
                className="mt-2 h-11 rounded-2xl"
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
                placeholder="仅保存在当前设备"
                className="mt-2 h-11 rounded-2xl"
              />
            </label>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-amber-200/50 bg-amber-50/50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            本地存储边界
          </div>
          <p className="mt-2">
            这里填写的设置暂时只会保存在本地设备。它们可用于当前设备的 AI 调试与接入，
            但尚未同步到远端设置服务。
          </p>
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
              placeholder="记录当前设备、工作区或 AI 接入的补充说明。"
            />
          </label>

          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleSave()}
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            title="保存高级设置"
          >
            {saveSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
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
