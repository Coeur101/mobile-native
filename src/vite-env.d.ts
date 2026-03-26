/// <reference types="vite/client" />
import type { SupabaseClient } from "@supabase/supabase-js";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_EMAIL_REDIRECT_TO?: string;
  readonly VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO?: string;
  readonly VITE_SUPABASE_SMTP_HOST?: string;
  readonly VITE_SUPABASE_SMTP_PORT?: string;
  readonly VITE_SUPABASE_SMTP_USER?: string;
  readonly VITE_SUPABASE_SMTP_PASSWORD?: string;
  readonly VITE_SUPABASE_SMTP_SENDER_EMAIL?: string;
  readonly VITE_SUPABASE_SMTP_SENDER_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APP_SUPABASE_MOCK__?: SupabaseClient;
}
