export interface AuthEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  OWNER_EMAIL?: string;
}

export interface AuthResult {
  ok: boolean;
  userId?: string;
  email?: string;
  status?: number;
  error?: string;
}

/**
 * Verifies Supabase JWT & single-owner access when SUPABASE_URL + SUPABASE_ANON_KEY are configured.
 * If Supabase is not yet configured on the server, permits local preview sessions cleanly.
 */
export async function verifyOwnerRequest(
  authHeader: string | null | undefined,
  env: AuthEnv
): Promise<AuthResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { ok: true, userId: 'local-owner' };
  }

  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization Bearer token.' };
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) {
      return { ok: false, status: 401, error: 'Invalid or expired Supabase session.' };
    }
    const user = (await res.json()) as {
      id?: string;
      email?: string;
      app_metadata?: { role?: string };
    };
    const role = user.app_metadata?.role;
    if (role !== 'owner') {
      return { ok: false, status: 403, error: 'Single-owner role required.' };
    }
    if (env.OWNER_EMAIL && user.email?.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) {
      return { ok: false, status: 403, error: 'Unauthorized owner account.' };
    }
    return { ok: true, userId: user.id, email: user.email };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Auth verification failed.',
    };
  }
}
