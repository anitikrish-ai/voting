import { createClient } from "@supabase/supabase-js";

export function createPublicServerClient() {
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE ANON KEY (first 15 chars):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15));
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}