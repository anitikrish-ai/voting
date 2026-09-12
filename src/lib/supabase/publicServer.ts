import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key server client used by public SSR pages (home, leaderboard).
 * No session persistence needed; RLS allows public reads of players and tournament.
 */
export function createPublicServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
