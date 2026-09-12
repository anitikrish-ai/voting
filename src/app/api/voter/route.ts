import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getOrCreateVoterKey } from "@/lib/voter";

// GET this on page load to know whether to show the ballot or the
// "you already voted for X" state — without ever trusting the client's
// own memory of what it voted for.
export async function GET() {
  try {
    const voterKey = await getOrCreateVoterKey();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .rpc("voter_status", { p_voter_key: voterKey })
      .single();

    if (error) {
      console.error("voter_status error:", error.message);
      return NextResponse.json({ hasVoted: false, playerId: null });
    }

    const row = data as { has_voted: boolean; player_id: string | null };
    return NextResponse.json({ hasVoted: row.has_voted, playerId: row.player_id });
  } catch (err) {
    console.error("Voter status route crashed:", err);
    return NextResponse.json({ hasVoted: false, playerId: null });
  }
}
