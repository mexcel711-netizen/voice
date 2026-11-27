export interface ClientEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  supabaseConfigured: boolean;
}

export function getClientEnv(): ClientEnv {
  const metaEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>)
      : {};

  const supabaseUrl = (metaEnv.VITE_SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const appName = (metaEnv.VITE_APP_NAME ?? 'Zara').trim() || 'Zara';

  const supabaseConfigured =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('http');

  return {
    supabaseUrl,
    supabaseAnonKey,
    appName,
    supabaseConfigured,
  };
}
