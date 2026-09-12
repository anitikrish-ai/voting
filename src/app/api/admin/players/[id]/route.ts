import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/players/:id
 * Allows the authenticated admin to update a player's name.
 * Authenticated + is_admin() check mirrors the tournament route pattern.
 * RLS "admins manage players" policy provides a second layer of enforcement
 * at the database level.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  if (!playerId) {
    return NextResponse.json({ message: "Player ID is required." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Verify session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  // Verify admin membership
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = body?.name;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { message: "A non-empty player name is required." },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 80) {
    return NextResponse.json(
      { message: "Player name must be 80 characters or fewer." },
      { status: 400 }
    );
  }

  // Verify the player exists first so we return a 404 instead of a silent no-op
  const { data: existing, error: fetchError } = await supabase
    .from("players")
    .select("id, name")
    .eq("id", playerId)
    .maybeSingle();

  if (fetchError) {
    console.error("Player fetch error:", fetchError.message);
    return NextResponse.json({ message: "Database error." }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ message: "Player not found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("players")
    .update({ name: trimmedName })
    .eq("id", playerId)
    .select("id, name, team, role, sort_order, votes_count")
    .single();

  if (updateError) {
    console.error("Player update error:", updateError.message);
    return NextResponse.json({ message: "Failed to save player name." }, { status: 500 });
  }

  return NextResponse.json({ player: updated });
}
