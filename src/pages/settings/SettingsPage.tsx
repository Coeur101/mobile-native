import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { mockAuthService } from "@/services/auth/mock-auth-service";
import { mockSettingsService } from "@/services/settings/mock-settings-service";
import type { UserSettings } from "@/types";

const defaultForm: UserSettings = {
  theme: "auto",
  preferredModel: "mock-gpt",
  customBaseUrl: "",
  apiKey: "",
  notes: "当前为演示模式，设置仅保存在本地。",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultForm);

  useEffect(() => {
    setSettings(mockSettingsService.getSettings());
  }, []);

  const handleSave = async () => {
    await mockSettingsService.saveSettings(settings);
    toast.success("设置已保存到本地。");
  };

  const handleLogout = async () => {
    await mockAuthService.signOut();
    toast.success("已退出演示模式。");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Settings</p>
              <h1 className="text-lg font-semibold text-slate-900">用户级设置</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">主题与模型</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                主题
                <select
                  value={settings.theme}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      theme: event.target.value as UserSettings["theme"],
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                >
                  <option value="auto">自动</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                模型偏好
                <Input
                  value={settings.preferredModel}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      preferredModel: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">认证与云端接入位</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
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
                  className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
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
                  className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </label>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-[28px] border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
          当前所有设置都只保存在本地。邮箱登录、微信登录、Supabase 会话、聊天记录云端存储和 AI 服务代理都已预留字段与服务接口，后续可以直接替换 mock 实现。
        </section>

        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            备注
            <textarea
              value={settings.notes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </section>
      </main>
    </div>
  );
}
