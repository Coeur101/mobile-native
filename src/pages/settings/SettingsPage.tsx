import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, LogOut, Save, Shield, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { buttonTap } from "@/lib/animations";
import { authService } from "@/services/auth";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
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
        <section className="rounded-[36px] border border-border bg-card/92 p-6 shadow-[var(--shadow-card)]">
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <div className="inline-flex rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
                当前设备配置
              </div>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.5rem]">
                只保留与当前工作设备和 AI 接入相关的高级配置。
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                主题、密码与账号摘要已经归并到 Profile 页面，这里专注模型、接口和设备备注，减少认知负担。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "存储范围", value: "仅当前设备" },
                { label: "配置类型", value: "AI 与设备" },
                { label: "当前主题", value: settings.theme || "auto" },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] bg-secondary/72 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-base font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-border bg-card/92 p-5 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[1.25rem] font-semibold text-foreground">AI 集成配置</h2>
                <p className="text-sm text-muted-foreground">
                  这些值仅保存在当前设备，用于连接你的 AI 服务并驱动项目生成。
                </p>
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
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-[32px] border border-amber-200/60 bg-amber-50/90 p-5 text-sm leading-7 text-amber-900 shadow-[var(--shadow-panel)] dark:border-amber-900/35 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4" />
                本地存储边界
              </div>
              <p className="mt-3">
                这里填写的配置暂时只会保存在本地设备，可用于当前设备的 AI 调试与接入，但尚未同步到远端设置服务。
              </p>
            </div>

            <div className="rounded-[32px] border border-border bg-card/92 p-5 shadow-[var(--shadow-panel)]">
              <label className="block text-sm font-medium text-foreground">
                备注
                <textarea
                  value={settings.notes}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="mt-2 min-h-36 w-full rounded-[24px] border border-border bg-input-background px-4 py-4 text-sm text-foreground outline-none transition focus:border-primary/25 focus:shadow-[var(--shadow-focus)]"
                  placeholder="记录当前设备、工作区或 AI 接入的补充说明。"
                />
              </label>

              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={() => void handleSave()}
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)]"
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
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}

