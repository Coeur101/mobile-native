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
  preferredModel: "mock-gpt",
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
    toast.success("Advanced settings saved.");
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLogout = async () => {
    await authService.signOut();
    toast.success("Signed out.");
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
              title="Back to profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Advanced Settings</h1>
              <p className="text-xs text-muted-foreground">
                Theme, password security, and account summary now live on the profile page.
              </p>
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
        <section className="rounded-[28px] border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Integration Controls</h2>
              <p className="text-sm text-muted-foreground">
                These values remain local and are intended for advanced debugging or future
                provider wiring.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Preferred Model
              <Input
                value={settings.preferredModel}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, preferredModel: event.target.value }))
                }
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
                placeholder="Stored locally on this device"
                className="mt-2 h-11 rounded-2xl"
              />
            </label>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-amber-200/50 bg-amber-50/50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            Local-only safety boundary
          </div>
          <p className="mt-2">
            Settings entered here are stored locally for now. They are useful for device-level
            preferences and future backend integration, but they are not synced to a remote
            settings service yet.
          </p>
        </section>

        <section className="mt-4 rounded-[28px] border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">
            Notes
            <textarea
              value={settings.notes}
              onChange={(event) =>
                setSettings((current) => ({ ...current, notes: event.target.value }))
              }
              className="mt-2 min-h-28 w-full rounded-3xl border border-border bg-input-background px-4 py-4 text-sm text-foreground outline-none transition focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
              placeholder="Personal notes for this device and workspace."
            />
          </label>

          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleSave()}
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            title="Save advanced settings"
          >
            {saveSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </motion.div>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>Save settings</span>
              </span>
            )}
          </motion.button>
        </section>
      </main>
    </PageTransition>
  );
}
