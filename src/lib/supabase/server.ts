import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cookie-aware server client, scoped to the signed-in user's session and
 * therefore subject to RLS as that user. Use this for admin-authenticated
 * reads/writes (e.g. toggling tournament status) so Postgres enforces
 * is_admin() itself — defense in depth beyond the route handler's own check.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no response to write to —
            // safe to ignore because middleware refreshes the session cookie.
          }
        },
      },
    }
  );
}

/**
 * Privileged, service-role client. SERVER-ONLY — this file must never be
 * imported from a "use client" component or bundled to the browser.
 * Used exclusively for the cast_vote / voter_status RPCs, which are
 * themselves revoked from anon/authenticated roles at the database level.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set on the server.");
  }
  return createBareClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
