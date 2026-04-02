import { localDb } from "@/lib/local-db";
import type { SettingsService } from "./settings-service";

export const mockSettingsService: SettingsService = {
  async loadSettings() {
    // mock 模式无需远端加载
  },
  getSettings() {
    return localDb.getSettings();
  },
  async saveSettings(settings) {
    localDb.saveSettings(settings);
  },
};
