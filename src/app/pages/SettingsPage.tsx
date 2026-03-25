import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Sun, Moon, Monitor, Save, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { storage } from "../utils/storage";
import { AppSettings } from "../types";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    uiStyle: "auto",
    baseUrl: "",
    apiKey: "",
  });

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const handleSave = () => {
    storage.saveSettings(settings);
    toast.success("设置已保存");
  };

  const handleLogout = () => {
    localStorage.removeItem("fake_user_logged_in");
    toast.success("已退出登录");
    navigate("/login", { replace: true });
  };

  const uiOptions = [
    { value: "light" as const, label: "浅色", icon: Sun },
    { value: "auto" as const, label: "自动", icon: Monitor },
    { value: "dark" as const, label: "深色", icon: Moon },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </motion.button>
            <h1 className="text-lg font-semibold text-slate-800">设置</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
            title="退出登录"
          >
            <LogOut className="w-5 h-5 text-red-500" />
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* UI Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <h2 className="text-sm font-semibold text-slate-800 mb-4">界面风格</h2>
          <div className="grid grid-cols-3 gap-3">
            {uiOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings.uiStyle === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, uiStyle: option.value }))
                  }
                  className={`h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    isActive
                      ? "border-slate-800 bg-slate-50"
                      : "border-slate-100 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-slate-800" : "text-slate-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {option.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-800">API 配置</h2>

          <div className="space-y-2">
            <Label htmlFor="baseUrl" className="text-xs text-slate-600">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              type="text"
              value={settings.baseUrl}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, baseUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
              className="rounded-xl border-slate-200 focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-xs text-slate-600">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="sk-..."
              className="rounded-xl border-slate-200 focus:border-slate-400"
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            配置您的 OpenAI API 或兼容的 API 端点。密钥仅存储在本地浏览器中。
          </p>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <h2 className="text-sm font-semibold text-slate-800 mb-3">关于</h2>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>版本</span>
              <span className="text-slate-800 font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>构建日期</span>
              <span className="text-slate-800 font-medium">2026-03-24</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-6 right-1/2 translate-x-1/2 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="w-14 h-14 rounded-full bg-slate-800 text-white shadow-xl shadow-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
          title="保存设置"
        >
          <Save className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}