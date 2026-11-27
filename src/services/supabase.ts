import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getClientEnv } from '../lib/env';

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return getClientEnv().supabaseConfigured;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey, supabaseConfigured } = getClientEnv();
  if (!supabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return cachedClient;
}

export async function getAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
