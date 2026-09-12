"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — uses only the public anon key. RLS restricts this to
 * reading players/tournament and to authenticated admin auth flows.
 * Never import the service-role key here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
