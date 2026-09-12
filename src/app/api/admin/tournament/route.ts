import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["open", "paused", "closed"] as const;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  // This update is additionally gated by the "admins manage tournament" RLS
  // policy (is_admin()), so even a forged request bypassing this check
  // would still be rejected by Postgres.
  const { data: tournamentRow } = await supabase
    .from("tournament")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!tournamentRow) {
    return NextResponse.json({ message: "Tournament not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("tournament")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", tournamentRow.id);

  if (error) {
    console.error("tournament update error:", error.message);
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ status });
}
