import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authConfig } from "@/services/auth/auth-config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    const injectedClient = (
      window as typeof window & { __APP_SUPABASE_MOCK__?: SupabaseClient }
    ).__APP_SUPABASE_MOCK__;
    if (injectedClient) {
      return injectedClient;
    }
  }

  if (!authConfig.isConfigured) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(authConfig.supabaseUrl!, authConfig.supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }

  return browserClient;
}
