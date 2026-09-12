import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getOrCreateVoterKey } from "@/lib/voter";

// Minimal in-memory rate limit per server instance: blocks obvious spam
// bursts from one IP without needing extra infra. Not a substitute for the
// DB-level uniqueness constraint, which is the real duplicate-vote guard.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { result: "rate_limited", message: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const playerId = body?.playerId;
    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json(
        { result: "invalid_request", message: "A player must be selected." },
        { status: 400 }
      );
    }

    const voterKey = await getOrCreateVoterKey();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .rpc("cast_vote", { p_voter_key: voterKey, p_player_id: playerId })
      .single();

    if (error) {
      console.error("cast_vote error:", error.message);
      return NextResponse.json(
        { result: "error", message: "Something went wrong recording your vote." },
        { status: 500 }
      );
    }

    const row = data as { result: string; player_id: string; votes_count: number };

    switch (row.result) {
      case "success":
        return NextResponse.json(
          { result: "success", playerId: row.player_id, votesCount: row.votes_count },
          { status: 200 }
        );
      case "already_voted":
        return NextResponse.json(
          { result: "already_voted", message: "This device has already voted." },
          { status: 409 }
        );
      case "voting_closed":
        return NextResponse.json(
          { result: "voting_closed", message: "Voting is not currently open." },
          { status: 403 }
        );
      case "invalid_player":
        return NextResponse.json(
          { result: "invalid_player", message: "That player could not be found." },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          { result: "error", message: "Unexpected response from the server." },
          { status: 500 }
        );
    }
  } catch (err) {
    console.error("Vote route crashed:", err);
    return NextResponse.json(
      { result: "error", message: "Unexpected server error." },
      { status: 500 }
    );
  }
}
