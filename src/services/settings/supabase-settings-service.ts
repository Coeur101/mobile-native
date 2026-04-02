import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { localDb, defaultSettings } from "@/lib/local-db";
import type { UserSettings } from "@/types";
import type { SettingsService } from "./settings-service";

type UserSettingsRow = {
  user_id: string;
  theme: string;
  preferred_model: string;
  custom_base_url: string;
  api_key: string;
  created_at: string;
  updated_at: string;
};

function requireClient(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("尚未配置 Supabase，无法读写用户设置。");
  }
  return client;
}

function requireCurrentUserId(): string {
  const userId = localDb.getUser()?.id;
  if (!userId) {
    throw new Error("需要先登录后才能访问用户设置。");
  }
  return userId;
}

function mapRowToSettings(row: UserSettingsRow): UserSettings {
  return {
    theme: (row.theme as UserSettings["theme"]) ?? "auto",
    preferredModel: row.preferred_model ?? "",
    customBaseUrl: row.custom_base_url ?? "",
    apiKey: row.api_key ?? "",
  };
}

let cachedSettings: UserSettings = { ...defaultSettings };

export function createSupabaseSettingsService(): SettingsService {
  return {
    async loadSettings() {
      let userId: string;
      try {
        userId = requireCurrentUserId();
      } catch {
        // 未登录，使用默认设置
        cachedSettings = { ...defaultSettings };
        return;
      }

      let client: SupabaseClient;
      try {
        client = requireClient();
      } catch {
        // Supabase 未配置，回退 localStorage
        cachedSettings = localDb.getSettings();
        return;
      }

      const { data, error } = await client
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        // 远端无数据或查询失败，回退 localStorage
        cachedSettings = localDb.getSettings();
        return;
      }

      cachedSettings = mapRowToSettings(data as UserSettingsRow);
    },

    getSettings(): UserSettings {
      return cachedSettings;
    },

    async saveSettings(settings: UserSettings) {
      // 立即更新内存缓存
      cachedSettings = { ...settings };

      const userId = requireCurrentUserId();
      const client = requireClient();

      const { error } = await client
        .from("user_settings")
        .update({
          theme: settings.theme,
          preferred_model: settings.preferredModel,
          custom_base_url: settings.customBaseUrl,
          api_key: settings.apiKey,
        })
        .eq("user_id", userId);

      if (error) {
        throw new Error(`保存设置失败：${error.message}`);
      }
    },
  };
}

export const supabaseSettingsService = createSupabaseSettingsService();
