const fallbackRedirectOrigin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

const trimEnv = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const supabaseUrl = trimEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const emailRedirectTo =
  trimEnv(import.meta.env.VITE_SUPABASE_EMAIL_REDIRECT_TO) ??
  `${fallbackRedirectOrigin}/login`;
const passwordResetRedirectTo =
  trimEnv(import.meta.env.VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO) ??
  emailRedirectTo;

const smtp = {
  host: trimEnv(import.meta.env.VITE_SUPABASE_SMTP_HOST),
  port: trimEnv(import.meta.env.VITE_SUPABASE_SMTP_PORT),
  user: trimEnv(import.meta.env.VITE_SUPABASE_SMTP_USER),
  passwordConfigured: Boolean(trimEnv(import.meta.env.VITE_SUPABASE_SMTP_PASSWORD)),
  senderEmail: trimEnv(import.meta.env.VITE_SUPABASE_SMTP_SENDER_EMAIL),
  senderName: trimEnv(import.meta.env.VITE_SUPABASE_SMTP_SENDER_NAME),
};

const missingRequiredEnv = [
  !supabaseUrl ? "VITE_SUPABASE_URL" : null,
  !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
].filter((value): value is string => Boolean(value));

export const authConfig = {
  supabaseUrl,
  supabaseAnonKey,
  emailRedirectTo,
  passwordResetRedirectTo,
  smtp,
  missingRequiredEnv,
  isConfigured: missingRequiredEnv.length === 0,
};

export function getAuthConfigurationError(): string {
  if (authConfig.isConfigured) {
    return "";
  }

  return `缺少认证环境变量：${authConfig.missingRequiredEnv.join("、")}。请先在 .env 中配置 Supabase 项目参数。`;
}
