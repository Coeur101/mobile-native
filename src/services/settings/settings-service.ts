import type { UserSettings } from "@/types";

export interface SettingsService {
  loadSettings(): Promise<void>;
  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): Promise<void>;
}
