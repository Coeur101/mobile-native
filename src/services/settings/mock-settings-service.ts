import { localDb } from "@/lib/local-db";
import type { SettingsService } from "./settings-service";

export const mockSettingsService: SettingsService = {
  getSettings() {
    return localDb.getSettings();
  },
  async saveSettings(settings) {
    localDb.saveSettings(settings);
  },
};
