import type { UserSettings } from "@/types";

export interface SettingsService {
  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): Promise<void>;
}
